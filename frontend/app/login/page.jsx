"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";


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
            } catch (e) {
                console.warn("[Login] Session check failed.", e);
                setSessionChecked(true);
            }
        };

        checkSession();
    }, [googleClientId, searchParams]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch(
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

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Error al iniciar sesión");
            }

            redirectToResolvedNext("email-login");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!sessionChecked) {
        return (
            <div style={styles.wrapper}>
                <div style={styles.card}>
                    <h1 style={styles.title}>Accede a tu cuenta</h1>
                    <p>Comprobando sesión...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div style={styles.wrapper}>
                <div style={styles.card}>
                    <h1 style={styles.title}>Accede a tu cuenta</h1>
                    <p>Sesión detectada. Redirigiendo...</p>
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
                            } catch (err) {
                                console.warn("[Login] Google login flow failed.", err);
                                setError("Error al iniciar sesión con Google");
                            }
                        }}
                        onError={() => {
                            console.warn("[Login] GoogleLogin onError fired before backend POST.");
                            setError("Error al iniciar sesión con Google");
                        }}
                    />
                ) : null}

                <div style={styles.separator}>— o —</div>

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

                    <label style={styles.label}>
                        Contraseña
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
                    ¿No tienes cuenta?
                    <br />
                    <strong>Se creará automáticamente si es tu primera vez</strong>
                </p>

                <a href="#" style={styles.forgot}>
                    ¿Olvidaste la contraseña?
                </a>
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
    googleButton: {
        width: "100%",
        padding: 12,
        background: "#4285F4",
        color: "#fff",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        marginBottom: 12,
    },
    googleSubtext: {
        display: "block",
        fontSize: 12,
        opacity: 0.9,
    },
    separator: {
        margin: "16px 0",
        color: "#888",
    },
    form: {
        textAlign: "left",
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
