export interface DatosCampana {
  nombreNegocio: string
  descripcionNegocio: string
  publicoObjetivo: string
  objetivoPrincipal: string
  colorMarca?: string
}

function moodPorObjetivo(objetivo: string): string {
  const mapa: Record<string, string> = {
    'ventas directas': 'energetic, highly attractive, persuasive, and dynamic',
    'reconocimiento de marca': 'luxurious, aspirational, iconic, and visually striking',
    'generación de leads': 'trustworthy, professional, sophisticated, and premium',
    'engagement': 'relatable, authentic, emotionally engaging, and vibrant',
  }
  const clave = (objetivo || '').toLowerCase().trim()
  return mapa[clave] || 'premium, professional, and visually stunning'
}

function clasificarCategoria(nombre: string, descripcion: string): { type: string; base: string } {
  const text = `${nombre} ${descripcion}`.toLowerCase()
  
  if (text.includes('empleo') || text.includes('trabajo') || text.includes('vacante')) {
    return {
      type: 'EMPLOYMENT',
      base: 'A highly realistic, candid, and modern workplace photography featuring diverse, authentic professionals working collaboratively in a bright, modern office space.'
    }
  }
  if (text.includes('evento') || text.includes('concierto') || text.includes('conferencia') || text.includes('taller')) {
    return {
      type: 'EVENT',
      base: 'An atmospheric, high-energy event photography capturing a real, vibrant crowd, beautiful ambient lighting, and an immersive, exciting experience.'
    }
  }
  if (text.includes('servicio') || text.includes('reparac') || text.includes('asesor') || text.includes('consultor')) {
    return {
      type: 'SERVICE',
      base: 'A premium lifestyle photography showing an expert professional delivering top-tier service to a happy client, clean environment, highly detailed, conveying trust and quality.'
    }
  }
  if (text.includes('ropa') || text.includes('moda') || text.includes('vestido') || text.includes('boutique') || text.includes('zapato') || text.includes('fashion') || text.includes('tenis')) {
    return {
      type: 'FASHION',
      base: 'High-end fashion photography, editorial style, featuring stylish clothing and accessories. Beautiful lighting, modern aesthetics, and a trendy, aspirational lifestyle vibe.'
    }
  }
  return {
    type: 'GENERAL',
    base: 'An ultra-realistic, high-end professional photography shot, showcasing perfect details, beautiful lighting, and an extremely appealing presentation.'
  }
}

export function generarPromptImagen(datos: DatosCampana): string {
  const cat = clasificarCategoria(datos.nombreNegocio, datos.descripcionNegocio)
  const mood = moodPorObjetivo(datos.objetivoPrincipal)

  return `Professional photography featuring: "${datos.nombreNegocio}, ${datos.descripcionNegocio}". Award-winning commercial photography, ultra-realistic, 8k resolution, photorealistic, shot on 85mm lens, f/1.8. Flawless, perfect proportions, highly detailed social media marketing asset. ${cat.base} The mood is ${mood}. Cinematic lighting, vibrant colors, sharp focus, masterpiece. Beautiful, clean composition with elegant negative space on the sides for marketing purposes. ABSOLUTELY NO text, NO words, NO letters, NO watermarks, NO fictional logos, NO deformities, NO extra fingers, NO blurry faces, NO mutations, NO bad anatomy, NO glitches.`.trim()
}

interface OpcionesGeneracionImagen {
  modelo?: 'nanobanana' | 'flux' | 'flux-realism' | 'ideogram-v4-quality'
  ancho?: number
  alto?: number
  seed?: number
}

export type TipoContenido = 'foto' | 'flyer'

function detectarTipoContenido(datos: DatosCampana, preferenciaExplicita?: TipoContenido): TipoContenido {
  if (preferenciaExplicita) return preferenciaExplicita
  const texto = `${datos.descripcionNegocio} ${datos.objetivoPrincipal}`.toLowerCase()
  const senalesFlyer = ['oferta', 'promoción', 'promocion', 'descuento', 'precio', 'flyer', 'cartel']
  return senalesFlyer.some((palabra) => texto.includes(palabra)) ? 'flyer' : 'foto'
}

function elegirModelo(tipo: TipoContenido): OpcionesGeneracionImagen['modelo'] {
  // Flux-realism is the current state-of-the-art for realistic, non-deformed humans.
  return tipo === 'flyer' ? 'ideogram-v4-quality' : 'flux-realism'
}

export function generarUrlImagen(
  datos: DatosCampana,
  opciones: OpcionesGeneracionImagen & { tipoContenido?: TipoContenido; textoParaFlyer?: string } = {}
): string {
  const {
    ancho = 1080,
    alto = 1350,
    seed = Math.floor(Math.random() * 1000000), // Randomize by default for variety
    tipoContenido,
    textoParaFlyer,
  } = opciones

  const tipo = detectarTipoContenido(datos, tipoContenido)
  const modelo = opciones.modelo ?? elegirModelo(tipo)

  let prompt = generarPromptImagen(datos)

  if (tipo === 'flyer') {
    prompt = prompt.replace(
      'NO text, NO words, NO letters, NO watermarks, NO fictional logos.',
      `Typography design flyer. Incorporate the following exact text perfectly rendered and legible into the image design: "${textoParaFlyer ?? datos.nombreNegocio}". Bold, elegant, professional font style, high contrast, perfect spelling.`
    )
  }

  // Truncar el prompt para evitar errores 414 (URI Too Long) o 403 de Cloudflare
  if (prompt.length > 800) {
    prompt = prompt.substring(0, 800) + '...';
  }
  const promptCodificado = encodeURIComponent(prompt)

  const params = new URLSearchParams({
    model: modelo!,
    width: String(ancho),
    height: String(alto),
    seed: String(seed),
    nologo: 'true',
    enhance: 'false' // Disable enhancement because it overrides negative prompts
  })

  return `https://image.pollinations.ai/prompt/${promptCodificado}?${params.toString()}`
}
