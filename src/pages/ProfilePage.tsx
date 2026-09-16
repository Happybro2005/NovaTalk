import { useNavigate } from 'react-router-dom'

function getStoredUser() {
  try {
    const raw = localStorage.getItem('novatalk-user')
    if (!raw) return { name: 'Your Name', username: '@username', bio: 'Exploring ideas, people, and new conversations across the galaxy.' }
    const user = JSON.parse(raw)
    return user && typeof user === 'object'
      ? {
          name: user.name || 'Your Name',
          username: user.username || '@username',
          bio: user.bio || 'Exploring ideas, people, and new conversations across the galaxy.',
          email: user.email || 'you@example.com',
        }
      : {
          name: 'Your Name',
          username: '@username',
          bio: 'Exploring ideas, people, and new conversations across the galaxy.',
          email: 'you@example.com',
        }
  } catch {
    return {
      name: 'Your Name',
      username: '@username',
      bio: 'Exploring ideas, people, and new conversations across the galaxy.',
      email: 'you@example.com',
    }
  }
}

function getInitials(name = 'User') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = getStoredUser()

  const handleLogout = () => {
    localStorage.removeItem('novatalk-user')
    navigate('/login')
  }

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (document.referrer && document.referrer.includes(window.location.host)) {
                  window.history.back()
                } else {
                  navigate('/dashboard')
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:bg-white/[0.06]"
              aria-label="Go back"
            >
              ←
            </button>
            <div>
              <div className="eyebrow">PROFILE</div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
                My profile
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
          >
            <span>Log out</span>
          </button>
        </header>

        <main className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="glass-strong rounded-2xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-2xl font-semibold">
                {getInitials(user.name)}
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">{user.name}</h2>
              <p className="mt-1 text-sm text-[#CBD5E1]">{user.username}</p>
            </div>

            <div className="mt-6 space-y-3 text-sm text-[#CBD5E1]">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-[#CBD5E1]/60">Bio</div>
                <p className="mt-2 text-white/90">{user.bio}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-[#CBD5E1]/60">Email</div>
                <p className="mt-2 text-white">{user.email}</p>
              </div>
            </div>
          </aside>

          <section className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="mb-6">
              <div className="eyebrow">ACCOUNT</div>
              <h2 className="mt-1 text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Profile details
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm text-[#CBD5E1]">
                <span className="mb-2 block">Display name</span>
                <input
                  type="text"
                  value={user.name}
                  readOnly
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white outline-none"
                />
              </label>

              <label className="block text-sm text-[#CBD5E1]">
                <span className="mb-2 block">Username</span>
                <input
                  type="text"
                  value={user.username}
                  readOnly
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white outline-none"
                />
              </label>

              <label className="block text-sm text-[#CBD5E1] md:col-span-2">
                <span className="mb-2 block">Bio</span>
                <textarea
                  rows={4}
                  readOnly
                  value={user.bio}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white outline-none"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3d7eff]"
              >
                Save changes
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
