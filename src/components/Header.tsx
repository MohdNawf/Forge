import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Header() {
  const { user, loading } = useAuth();
  return (
    <header className="border-b border-rule bg-paper px-6 py-4 md:px-10">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display text-4xl leading-none">
            Forge
          </Link>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.24em] text-ink/70 md:block">
            / Build with people
          </span>
        </div>
      <nav className="hidden gap-8 text-[15px] md:flex">
        <Link to="/discover">Discover</Link>
        <Link to="/requests">Requests</Link>
        <Link to="/messages">Messages</Link>
        <Link to="/workspace">Workspace</Link>
      </nav>
      {user ? (
        <div className="flex items-center gap-3">
          {!loading && (
            <Link
              to="/create"
              className="bg-ink px-5 py-2 text-sm font-medium text-paper"
            >
              <span className="mr-2 text-acid">•</span>New project
            </Link>
          )}
          <Link
            to="/profile"
            className="border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-paper"
          >
            Profile
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {!loading && (
            <Link
              to="/create"
              className="bg-ink px-5 py-2 text-sm font-medium text-paper"
            >
              <span className="mr-2 text-acid">•</span>New project
            </Link>
          )}
          <Link
            to="/auth"
            className="border border-ink px-4 py-2 text-sm font-medium text-ink"
          >
            Sign in
          </Link>
        </div>
      )}
      </div>
    </header>
  );
}
