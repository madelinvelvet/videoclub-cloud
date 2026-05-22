import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PeliculaDetalle({ params }) {
  // Obtener el ID desde la URL de manera segura
  const { id } = await params;
  const peliculas = await kv.get('peliculas_estado') || [];
  const pelicula = peliculas.find(p => p.id === id);

  if (!pelicula) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <p className="mb-4">Película no encontrada</p>
        <Link href="/" className="text-indigo-400 underline">Volver al inicio</Link>
      </div>
    );
  }

  const inquilinos = pelicula.alquiladaPor || [];
  const limiteAlcanzado = inquilinos.length >= 4;

  // Server Action para procesar el alquiler múltiple
  async function alquilarPelicula(formData) {
    'use server';
    const nombre = formData.get('nombreInquilino')?.trim();
    if (!nombre) return;

    const listaActual = await kv.get('peliculas_estado') || [];
    
    const listaActualizada = listaActual.map(p => {
      if (p.id === id) {
        const copiaInquilinos = [...(p.alquiladaPor || [])];
        // Evitar que alquile si ya llegó a 4 o si esa persona ya la tiene
        if (copiaInquilinos.length < 4 && !copiaInquilinos.includes(nombre)) {
          copiaInquilinos.push(nombre);
        }
        return { ...p, alquiladaPor: copiaInquilinos };
      }
      return p;
    });

    await kv.set('peliculas_estado', listaActualizada);
    revalidatePath(`/pelicula/${id}`);
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
          ← Volver a la cartelera
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-2xl">
          {/* Columna Póster */}
          <div className="aspect-[2/3] w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pelicula.poster} alt={pelicula.titulo} className="w-full h-full object-cover" />
          </div>

          {/* Columna Información e Interacción */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-extrabold mb-1">{pelicula.titulo}</h1>
              <span className="inline-block bg-indigo-900/50 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-700 mb-4">
                {pelicula.genero}
              </span>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {pelicula.descripcion}
              </p>
            </div>

            {/* Formulario de Alquiler */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
              <h3 className="text-sm font-bold text-slate-200 mb-3">Nuevo Alquiler ({inquilinos.length}/4 ocupados)</h3>
              
              {!limiteAlcanzado ? (
                <form action={alquilarPelicula} className="flex gap-2">
                  <input 
                    type="text" 
                    name="nombreInquilino" 
                    placeholder="Escribe tu nombre para alquilar..." 
                    required
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
                  >
                    Alquilar
                  </button>
                </form>
              ) : (
                <p className="text-sm text-amber-400 font-medium">⚠️ Todos los cupos de alquiler para esta película están completos.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sección de inquilinos actuales */}
        <div className="mt-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            👥 Personas que la están viendo actualmente
          </h2>
          {inquilinos.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inquilinos.map((persona, index) => (
                <li key={index} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                    {persona.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{persona}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">Nadie ha alquilado esta película aún. ¡Sé el primero!</p>
          )}
        </div>
      </div>
    </main>
  );
}