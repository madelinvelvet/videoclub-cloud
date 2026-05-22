import { kv } from '@vercel/kv';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const PELICULAS_INICIALES = [
  { 
    id: '1', 
    titulo: 'Pulp Fiction', 
    genero: 'Acción / Crimen', 
    poster: '/pulp-fiction.jpg',
    descripcion: 'Las vidas de dos distribuidores de marihuana, un boxeador, la esposa de un gángster y dos bandidos se entrelazan en cuatro historias de violencia y redención.'
  },
  { 
    id: '2', 
    titulo: 'Interstellar', 
    genero: 'Sci-Fi / Drama', 
    poster: '/interstellar.jpg',
    descripcion: 'Un equipo de exploradores viaja a través de un agujero de gusano en el espacio en un intento por asegurar la supervivencia de la humanidad.'
  },
  { 
    id: '3', 
    titulo: 'El Rey León', 
    genero: 'Animación / Familiar', 
    poster: '/rey-leon.jpg',
    descripcion: 'Tras la muerte de su padre, un joven león regresa a su hogar para reclamar el trono que le pertenece y restaurar el equilibrio.'
  },
  { 
    id: '4', 
    titulo: 'El Conjuro', 
    genero: 'Terror', 
    poster: '/conjuro.jpg',
    descripcion: 'Investigadores paranormales trabajan para ayudar a una familia aterrorizada por una presencia oscura en su granja.'
  }
];

export default async function Home() {
  // 1. Intentamos traer lo que ya está guardado en internet
  let peliculas = await kv.get('peliculas_estado');
  
  // 2. CÓDIGO SEGURO: Si no hay NADA en la base de datos (primera vez absoluta), las creamos
  if (!peliculas || peliculas.length === 0) {
    const estadoInicial = PELICULAS_INICIALES.map(p => ({ ...p, alquiladaPor: [] }));
    await kv.set('peliculas_estado', estadoInicial);
    peliculas = estadoInicial;
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-400 mb-2">🍿 Maddie videoclub</h1>
          <p className="text-slate-400">Alquila tus películas favoritas</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {peliculas.map((pelicula) => {
            // Aseguramos que alquiladaPor sea un array para evitar errores visuales
            const inquilinos = Array.isArray(pelicula.alquiladaPor) ? pelicula.alquiladaPor : [];
            const cuposDisponibles = 4 - inquilinos.length;
            
            return (
              <div key={pelicula.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg flex flex-col justify-between group">
                <div className="relative aspect-[2/3] w-full bg-slate-950 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={pelicula.poster} 
                    alt={pelicula.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-indigo-300 border border-slate-700">
                    {cuposDisponibles > 0 ? `${cuposDisponibles} Libres` : 'Agotada'}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold line-clamp-1">{pelicula.titulo}</h2>
                    <p className="text-xs text-indigo-400 font-medium">{pelicula.genero}</p>
                    
                    {/* Pequeño extra opcional: Muestra quién la tiene desde la portada */}
                    {inquilinos.length > 0 && (
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        👥 {inquilinos.join(', ')}
                      </p>
                    )}
                  </div>

                  <Link 
                    href={`/pelicula/${pelicula.id}`}
                    className="w-full block text-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    Ver Info & Alquilar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}