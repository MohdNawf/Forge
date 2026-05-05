import { useNavigate, useSearchParams } from "react-router-dom";
import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSignedIn } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );

  useEffect(() => {
    if (isSignedIn) navigate("/discover");
  }, [isSignedIn, navigate]);

  return (
    <div className="mx-auto max-w-md p-12">
      <h1 className="text-5xl">{mode === "signin" ? "Welcome back." : "Join Forge."}</h1>
      <div className="mt-8">
        {mode === "signin" ? (
          <SignIn
            routing="path"
            path="/auth"
            signUpUrl="/auth?mode=signup"
            fallbackRedirectUrl="/discover"
          />
        ) : (
          <SignUp
            routing="path"
            path="/auth"
            signInUrl="/auth?mode=signin"
            fallbackRedirectUrl="/discover"
          />
        )}
      </div>
      <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-4 text-sm text-ink/60 hover:text-ink">
        {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
