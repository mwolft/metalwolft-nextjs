"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";

import { PASSWORD_POLICY_HELP, getPasswordPolicyError } from "@/lib/passwordPolicy";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const redirectTargetRef = useRef(null);

    const getSafeNextPath = () => {
        const rawNext = searchParams.get("next");
        return rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
            ? rawNext
            : "/";
    };

    const redirectToResolvedNext = (reason) => {
        const destination = getSafeNextPath();

        console.info("[Login] Raw next at redirect time:", searchParams.get("next"));
        if (redirectTargetRef.current === destination) return;
        redirectTargetRef.current = destination;

        console.info("[Login] Redirecting.", {
            branch: reason,
            destination,
        });

        window.location.assign(destination);
    };

    useEffect(() => {
        const requestedNext = searchParams.get("next");

        console.info("[Login] Google client ID:", googleClientId ?? "undefined");
        console.info("[Login] Current URL:", window.location.href);
        console.info("[Login] Raw next param:", requestedNext);
        console.info("[Login] Resolved nextPath:", getSafeNextPath());

        const checkSession = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/profile`,
                    {
                        credentials: "include",
                    }
                );

                if (res.status === 401) {
                    console.info("[Login] No active session. Showing login screen.");
                    setSessionChecked(true);
                    return;
                }

                if (res.ok) {
                    setIsAuthenticated(true);
                    setSessionChecked(true);
                    redirectToResolvedNext("active-session");
                    return;
                }

                setSessionChecked(true);
            } catch (sessionError) {
                console.warn("[Login] Session check failed.", sessionError);
                setSessionChecked(true);
            }
        };

        void checkSession();
    }, [googleClientId, searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const loginRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ email, password }),
                }
            );

            if (loginRes.ok) {
                redirectToResolvedNext("email-login");
                return;
            }

            if (loginRes.status !== 401) {
                const loginData = await loginRes.json();
                throw new Error(loginData.error || loginData.message || "Error al iniciar sesion");
            }

            const passwordPolicyError = getPasswordPolicyError(password);
            if (passwordPolicyError) {
                throw new Error(
                    `${passwordPolicyError} Si es tu primera vez, necesitamos una contrasena valida para crear la cuenta automaticamente.`
                );
            }

            console.info("[Login] Login returned 401. Attempting automatic signup.");
            const registerRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ email, password }),
                }
            );

            if (!registerRes.ok) {
                const registerData = await registerRes.json();
                throw new Error(
                    registerData.error || registerData.message || "No se pudo crear la cuenta automaticamente"
                );
            }

            redirectToResolvedNext("email-register");
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setLoading(false);
        }
    };

    if (!sessionChecked) {
        return (
            <div style={styles.wrapper}>
                <div style={styles.card}>
                    <h1 style={styles.title}>Accede a tu cuenta</h1>
                    <p>Comprobando sesion...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div style={styles.wrapper}>
                <div style={styles.card}>
                    <h1 style={styles.title}>Accede a tu cuenta</h1>
                    <p>Sesion detectada. Redirigiendo...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <h1 style={styles.title}>Accede a tu cuenta</h1>

                {googleClientId ? (
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            try {
                                console.info("[Login] GoogleLogin onSuccess fired.", {
                                    hasCredential: Boolean(credentialResponse.credential),
                                });

                                if (!credentialResponse.credential) {
                                    throw new Error("Missing Google credential");
                                }

                                console.info("[Login] Posting Google credential to backend.");
                                const res = await fetch(
                                    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
                                    {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({
                                            token: credentialResponse.credential,
                                        }),
                                    }
                                );

                                console.info("[Login] Backend Google auth response.", {
                                    status: res.status,
                                    ok: res.ok,
                                });

                                if (!res.ok) {
                                    throw new Error("Google login failed");
                                }

                                redirectToResolvedNext("google-login");
                            } catch (googleError) {
                                console.warn("[Login] Google login flow failed.", googleError);
                                setError("Error al iniciar sesion con Google");
                            }
                        }}
                        onError={() => {
                            console.warn("[Login] GoogleLogin onError fired before backend POST.");
                            setError("Error al iniciar sesion con Google");
                        }}
                    />
                ) : null}

                <div style={styles.separator}>- o -</div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </label>

                    <p style={styles.passwordHint}>{PASSWORD_POLICY_HELP}</p>
                    <label style={styles.label}>
                        Contrasena
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </label>

                    {error && <p style={styles.error}>{error}</p>}

                    <button type="submit" style={styles.submitButton} disabled={loading}>
                        {loading ? "Accediendo..." : "Acceder"}
                    </button>
                </form>

                <p style={styles.info}>
                    No tienes cuenta?
                    <br />
                    <strong>Se creara automaticamente si es tu primera vez</strong>
                </p>

                <Link href="/forgot-password" style={styles.forgot}>
                    Olvidaste la contrasena?
                </Link>
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
    },
    card: {
        width: "100%",
        maxWidth: 400,
        background: "#fff",
        padding: 24,
        borderRadius: 8,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        textAlign: "center",
    },
    title: {
        marginBottom: 20,
    },
    separator: {
        margin: "16px 0",
        color: "#888",
    },
    form: {
        textAlign: "left",
    },
    passwordHint: {
        marginBottom: 8,
        fontSize: 12,
        color: "#525252",
    },
    label: {
        display: "block",
        marginBottom: 12,
        fontSize: 14,
    },
    input: {
        width: "100%",
        padding: 8,
        marginTop: 4,
        borderRadius: 4,
        border: "1px solid #ccc",
    },
    submitButton: {
        width: "100%",
        padding: 12,
        marginTop: 12,
        background: "#000",
        color: "#fff",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
    },
    error: {
        color: "red",
        marginTop: 8,
    },
    info: {
        marginTop: 16,
        fontSize: 14,
    },
    forgot: {
        display: "block",
        marginTop: 8,
        fontSize: 13,
        color: "#555",
    },
};
