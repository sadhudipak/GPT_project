import "./Auth.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (
            !name.trim() ||
            !email.trim() ||
            !password.trim() ||
            !confirmPassword.trim()
        ) {
            setError("Please fill in all fields.");
            return;
        }

        if (name.trim().length < 2) {
            setError("Name must be at least 2 characters.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await signup(
                name.trim(),
                email.trim(),
                password
            );

            navigate("/", { replace: true });
        } catch (err) {
            setError(
                err.message || "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="authPage">
            <div className="authBackground">
                <div className="authGlow authGlowOne"></div>
                <div className="authGlow authGlowTwo"></div>
            </div>

            <section className="authCard signupCard">
                <div className="authLogo">
                    <span>✦</span>
                </div>

                <div className="authHeader">
                    <h1>Create your account</h1>
                    <p>
                        Start your AI conversations in seconds
                    </p>
                </div>

                {error && (
                    <div className="authError">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span>{error}</span>
                    </div>
                )}

                <form
                    className="authForm"
                    onSubmit={handleSubmit}
                >
                    <div className="authField">
                        <label htmlFor="name">
                            Full name
                        </label>

                        <div className="inputWrapper">
                            <i className="fa-solid fa-user"></i>

                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                placeholder="Your name"
                                autoComplete="name"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="authField">
                        <label htmlFor="signupEmail">
                            Email address
                        </label>

                        <div className="inputWrapper">
                            <i className="fa-solid fa-envelope"></i>

                            <input
                                id="signupEmail"
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="you@example.com"
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="authField">
                        <label htmlFor="signupPassword">
                            Password
                        </label>

                        <div className="inputWrapper">
                            <i className="fa-solid fa-lock"></i>

                            <input
                                id="signupPassword"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
                                disabled={loading}
                            />

                            <button
                                type="button"
                                className="passwordToggle"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >
                                <i
                                    className={`fa-solid ${
                                        showPassword
                                            ? "fa-eye-slash"
                                            : "fa-eye"
                                    }`}
                                ></i>
                            </button>
                        </div>
                    </div>

                    <div className="authField">
                        <label htmlFor="confirmPassword">
                            Confirm password
                        </label>

                        <div className="inputWrapper">
                            <i className="fa-solid fa-shield-halved"></i>

                            <input
                                id="confirmPassword"
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Repeat your password"
                                autoComplete="new-password"
                                disabled={loading}
                            />

                            <button
                                type="button"
                                className="passwordToggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        !showConfirmPassword
                                    )
                                }
                            >
                                <i
                                    className={`fa-solid ${
                                        showConfirmPassword
                                            ? "fa-eye-slash"
                                            : "fa-eye"
                                    }`}
                                ></i>
                            </button>
                        </div>
                    </div>

                    {password && (
                        <div className="passwordStrength">
                            <div className="strengthHeader">
                                <span>Password strength</span>
                                <span>
                                    {password.length < 6
                                        ? "Weak"
                                        : password.length < 10
                                        ? "Good"
                                        : "Strong"}
                                </span>
                            </div>

                            <div className="strengthBar">
                                <span
                                    className={
                                        password.length < 6
                                            ? "weak"
                                            : password.length < 10
                                            ? "good"
                                            : "strong"
                                    }
                                ></span>
                            </div>
                        </div>
                    )}

                    <button
                        className="authSubmit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Creating account...
                            </>
                        ) : (
                            <>
                                Create account
                                <i className="fa-solid fa-arrow-right"></i>
                            </>
                        )}
                    </button>
                </form>

                <div className="authDivider">
                    <span>or</span>
                </div>

                <p className="authSwitch">
                    Already have an account?
                    <Link to="/login">
                        Sign in
                    </Link>
                </p>

                <p className="authFooter">
                    Your account keeps your conversations private.
                </p>
            </section>
        </main>
    );
}

export default Signup;