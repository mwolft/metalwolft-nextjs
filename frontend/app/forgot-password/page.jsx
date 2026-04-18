"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/password-reset/request`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                }
            );

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || "No se pudo solicitar la recuperacion");
            }

            setSuccess(data.message);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <h1 style={styles.title}>Recuperar contrasena</h1>
                <p style={styles.text}>
                    Introduce tu email y te enviaremos un enlace para restablecer la contrasena.
                </p>

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

                    {error ? <p style={styles.error}>{error}</p> : null}
                    {success ? <p style={styles.success}>{success}</p> : null}

                    <button type="submit" style={styles.submitButton} disabled={loading}>
                        {loading ? "Enviando..." : "Enviar enlace"}
                    </button>
                </form>

                <Link href="/login" style={styles.link}>
                    Volver al login
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
        maxWidth: 420,
        background: "#fff",
        padding: 24,
        borderRadius: 8,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    },
    title: {
        marginTop: 0,
        marginBottom: 12,
    },
    text: {
        marginBottom: 16,
        color: "#525252",
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
    success: {
        color: "#166534",
        marginTop: 8,
    },
    link: {
        display: "inline-block",
        marginTop: 16,
        color: "#555",
    },
};
