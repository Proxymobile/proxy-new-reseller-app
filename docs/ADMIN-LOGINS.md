# Admin Logins

Staff sign in to `/admin` with an **email and password**. Every admin account
also keeps its access code, so a forgotten password is never a lockout.

## Creating the first admin

The panel needs an admin to open it, so the first one is made from the command
line. Run migrations first — the password columns ship in `007`.

```sh
npm run db:migrate
npm run admin:create -- --email you@proxymobile.shop --name Lukas
```

A strong password is generated and printed once. Pass `--password '...'` to
choose your own (12+ characters, with an uppercase letter, a lowercase letter
and a digit). Re-running with an existing email promotes that account to admin
and resets its password.

## Creating further admins

*Admin → Admin logins → New admin login*. Leave the password blank to have one
generated; it is shown once and never stored in readable form. New admins are
flagged **must change**, and change it themselves at the bottom of the same
page.

From that page you can also reset a password, remove password login (leaving
the access code), disable an account, or revoke admin rights. The API refuses
to disable or demote the last enabled admin, and refuses to let you do either
to your own account.

## Retire `ADMIN_PASSWORD`

The old shared `ADMIN_PASSWORD` environment variable signs whoever knows it in
as the *first* admin account, so the audit log cannot say who acted. Once named
logins exist, delete the variable and redeploy. The panel shows a warning while
it is still set.

## How it works

- Passwords are hashed with **scrypt** from Node's own `crypto` — no native
  build step, no extra dependency. The stored string is self-describing
  (`scrypt$N$r$p$salt$key`), so the cost parameters can be raised later without
  invalidating existing hashes.
- Failed sign-ins always run a real scrypt verification, against a dummy hash
  when no account matches, so the endpoint cannot be used to discover which
  staff emails exist.
- Attempts are rate-limited per email (5 failures per 15 minutes) through the
  same `login_attempts` table as access codes, so brute force against either
  credential shares one budget.
- The error shown is always "Incorrect email or password", never which half
  was wrong.
