"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";


export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/profile`,
                    {
                        credentials: "include",
                    }
                );

                if (res.ok) {
                    // Ya hay sesión → fuera del login
                    router.replace("/");
                }
            } catch (e) {
                // Silencioso: si falla, mostramos el login normal
            }
        };

        checkSession();
    }, [router]);


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
                    credentials: "include", // MUY IMPORTANTE (cookies)
                    body: JSON.stringify({ email, password }),
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Error al iniciar sesión");
            }

            // Login correcto → el backend ya ha puesto las cookies
            router.push("/");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <h1 style={styles.title}>Accede a tu cuenta</h1>

                <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                        try {
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

                            if (!res.ok) {
                                throw new Error("Google login failed");
                            }

                            router.push("/");
                        } catch (err) {
                            setError("Error al iniciar sesión con Google");
                        }
                    }}
                    onError={() => {
                        setError("Error al iniciar sesión con Google");
                    }}
                />


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

/* === estilos inline simples (luego los pasamos a CSS/Tailwind) === */

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
