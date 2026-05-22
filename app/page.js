import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';

// Indicamos a Next.js que no cachee esta página para que muestre los alquileres en tiempo real
export const dynamic = 'force-dynamic';

// Lista base de películas (si la base de datos está vacía, cargará estas)
const PELICULAS_INICIALES = [
  { id: '1', titulo: 'Pulp Fiction', genero: 'Acción / Crimen', emoji: '🎬' },
  { id: '2', titulo: 'Interstellar', genero: 'Sci-Fi / Drama', emoji: '🚀' },
  { id: '3', titulo: 'El Rey León', genero: 'Animación / Familiar', emoji: '🦁' },
  { id: '4', titulo: 'El Conjuro', genero: 'Terror', emoji: '👻' }
];

export default async function Home() {
  // 1. Leer el estado actual de las películas desde la nube de Vercel
  let peliculas = await kv.get('peliculas_estado');
  
  // Si es la primera vez que abre la app, guardamos la lista inicial en la nube
  if (!peliculas) {
    await kv.set('peliculas_estado', PELICULAS_INICIALES.map(p => ({ ...p, alquiladaPor: null })));
    peliculas = await kv.get('peliculas_estado');
  }

  // 2. Acción del Servidor (Server Action) para Alquilar o Devolver
  async function gestionarAlquiler(formData) {
    'use server';
    const peliculaId = formData.get('peliculaId');
    const accion = formData.get('accion');
    const usuario = formData.get('nombreUsuario') || 'Anónimo';

    const listaActual = await kv.get('peliculas_estado') || [];
    
    const listaActualizada = listaActual.map(p => {
      if (p.id === peliculaId) {
        return {
          ...p,
          alquiladaPor: accion === 'alquilar' ? usuario : null
        };
      }
      return p;
    });

    // Guardar los nuevos estados directamente en la nube de Vercel KV
    await kv.set('peliculas_estado', listaActualizada);
    
    // Refrescar la pantalla inmediatamente para ver los cambios
    revalidatePath('/');
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-400 mb-2">🍿 Maddie videoclub</h1>
          <p className="text-slate-400">Alquiler de películas en tiempo real</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {peliculas.map((pelicula) => (
            <div key={pelicula.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col justify-between">
              <div>
                <div className="text-4xl mb-3">{pelicula.emoji}</div>
                <h2 className="text-xl font-bold mb-1">{pelicula.titulo}</h2>
                <p className="text-sm text-indigo-300 mb-4">{pelicula.genero}</p>
                
                {/* Etiqueta de estado */}
                <div className="mb-6">
                  {pelicula.alquiladaPor ? (
                    <span className="bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-xs font-semibold border border-red-700">
                      🔴 Alquilada por: {pelicula.alquiladaPor}
                    </span>
                  ) : (
                    <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-xs font-semibold border border-green-700">
                      🟢 Disponible
                    </span>
                  )}
                </div>
              </div>

              {/* Formulario interactivo usando Server Actions nativos */}
              <form action={gestionarAlquiler} className="space-y-3">
                <input type="hidden" name="peliculaId" value={pelicula.id} />
                
                {!pelicula.alquiladaPor ? (
                  <>
                    <input 
                      type="text" 
                      name="nombreUsuario" 
                      placeholder="Tu nombre..." 
                      required
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      type="submit" 
                      name="accion" 
                      value="alquilar"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      Alquilar Película
                    </button>
                  </>
                ) : (
                  <button 
                    type="submit" 
                    name="accion" 
                    value="devolver"
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    Devolver Película
                  </button>
                )}
              </form>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}