'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="standalone"><p className="eyebrow">Algo interrumpió el estudio</p><h1>No pudimos cargar esta página.</h1><p>Tus cambios guardados permanecen en el espacio de trabajo.</p><button className="primary" onClick={reset}>Intentar de nuevo</button></main>; }
