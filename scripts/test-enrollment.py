"""Run with python3 scripts/test-enrollment.py; requires PostgreSQL binaries on PATH."""

import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import tempfile
import time
import unittest


ROOT = Path(__file__).resolve().parents[1]


class EnrollmentTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="nihongo-enrollment-")
        cls.folder = Path(cls.temp.name)
        cls.data = cls.folder / "data"
        subprocess.run(
            ["initdb", "-D", str(cls.data), "-A", "trust", "-U", "postgres"],
            check=True, stdout=subprocess.DEVNULL, text=True,
        )
        try:
            subprocess.run(
                ["pg_ctl", "-D", str(cls.data), "-l", str(cls.folder / "server.log"),
                 "-o", f"-k {cls.folder} -h '' -p 55437", "-w", "start"],
                check=True, text=True,
            )
            cls.sql("""
                create role authenticated;
                create role service_role bypassrls;
                create schema auth;
                create table auth.users (id uuid primary key);
                create function auth.uid() returns uuid language sql
                  as 'select null::uuid';
            """)
            for name in ("001_study.sql", "002_invite_links.sql",
                         "004_atomic_join_enrollment.sql", "007_atomic_allowlist_enrollment.sql"):
                path = ROOT / "supabase/migrations" / name
                if path.exists():
                    cls.sql(path.read_text())
        except Exception:
            cls.tearDownClass()
            raise

    @classmethod
    def tearDownClass(cls):
        subprocess.run(["pg_ctl", "-D", str(cls.data), "-m", "immediate", "-w", "stop"],
                       capture_output=True, text=True)
        cls.temp.cleanup()

    @classmethod
    def sql(cls, query):
        result = subprocess.run(
            ["psql", "-X", "-At", "-v", "ON_ERROR_STOP=1", "-h", str(cls.folder),
             "-p", "55437", "-U", "postgres", "-d", "postgres", "-c", query],
            capture_output=True, text=True,
        )
        if result.returncode:
            raise AssertionError(result.stderr)
        return result.stdout.strip()

    def setUp(self):
        self.sql("""
            truncate participants, invited_emails, invite_links, auth.users cascade;
            insert into auth.users values
              ('00000000-0000-0000-0000-000000000001'),
              ('00000000-0000-0000-0000-000000000002');
            insert into invited_emails(email) values ('allowlisted@example.org');
            insert into invite_links(code, max_signups) values ('T1', 10);
        """)

    def enroll(self, kind, user, email):
        args = f"'00000000-0000-0000-0000-{user:012d}', '{email}', "
        if kind == "join":
            args += "'T1', "
        return json.loads(self.sql(
            f"set role service_role; select enroll_{kind}_participant({args}'test');"
        ).splitlines()[-1])

    def concurrent_enrollments(self, calls):
        # Queue both requests behind a real lock so this also fails reliably on the old RPC.
        blocker = subprocess.Popen(
            ["psql", "-X", "-At", "-v", "ON_ERROR_STOP=1", "-h", str(self.folder),
             "-p", "55437", "-U", "postgres", "-d", "postgres"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        )
        with ThreadPoolExecutor(max_workers=2) as pool:
            try:
                blocker.stdin.write("begin; select pg_advisory_xact_lock(hashtext('nihongo.participant.id')); select 'ready';\n")
                blocker.stdin.flush()
                while blocker.stdout.readline().strip() != "ready":
                    if blocker.poll() is not None:
                        self.fail(blocker.stderr.read())
                futures = [pool.submit(self.enroll, *call) for call in calls]
                deadline = time.monotonic() + 10
                while self.sql("""
                    select count(*) from pg_stat_activity
                    where wait_event_type='Lock' and query like 'set role service_role;%'
                """) != "2":
                    if time.monotonic() >= deadline:
                        self.fail("Concurrent enrollment requests did not reach the lock")
                    time.sleep(0.01)
            finally:
                blocker.communicate("commit;\n\\q\n", timeout=10)
            return [future.result() for future in futures]

    def test_concurrent_allowlist_and_join_get_distinct_ids(self):
        results = self.concurrent_enrollments([
            ("allowlisted", 1, "allowlisted@example.org"), ("join", 2, "join@example.org")
        ])
        self.assertEqual({result["participant_id"] for result in results}, {"P001", "P002"})
        self.assertTrue(all(result["status"] == "ok" for result in results))
        self.assertEqual(self.sql("select count(*) from participants"), "2")
        self.assertEqual(self.sql("select signup_count from invite_links where code='T1'"), "1")

    def test_repeated_join_requests_share_the_last_slot(self):
        self.sql("update invite_links set max_signups=1 where code='T1'")
        results = self.concurrent_enrollments([("join", 1, "join@example.org")] * 2)
        self.assertEqual(results, [{"status": "ok", "participant_id": "P001"}] * 2)
        self.assertEqual(self.sql("select count(*) from participants"), "1")
        self.assertEqual(self.sql("select signup_count from invite_links where code='T1'"), "1")

    def test_repeated_allowlist_requests_reuse_participant(self):
        results = self.concurrent_enrollments([("allowlisted", 1, "allowlisted@example.org")] * 2)
        self.assertEqual(results, [{"status": "ok", "participant_id": "P001"}] * 2)
        self.assertEqual(self.sql("select count(*) from participants"), "1")
        self.assertEqual(self.sql("select signup_count from invite_links where code='T1'"), "0")

    def test_non_allowlisted_user_is_not_enrolled(self):
        self.assertEqual(self.enroll("allowlisted", 1, "other@example.org"),
                         {"status": "not_invited"})
        self.assertEqual(self.sql("select count(*) from participants"), "0")

    def test_enrollment_functions_are_not_public(self):
        for signature in ("enroll_allowlisted_participant(uuid,text,text)",
                          "enroll_join_participant(uuid,text,text,text)"):
            self.assertEqual(self.sql(
                f"select has_function_privilege('authenticated', '{signature}', 'execute')"
            ), "f")

    def test_ids_continue_past_three_digits(self):
        self.sql("""
            insert into participants values ('00000000-0000-0000-0000-000000000002',
              'existing@example.org', 'P999', 'test', now());
        """)
        self.assertEqual(self.enroll("allowlisted", 1, "allowlisted@example.org"),
                         {"status": "ok", "participant_id": "P1000"})


if __name__ == "__main__":
    unittest.main()
