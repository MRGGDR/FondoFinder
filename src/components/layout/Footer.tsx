import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="w-full bg-white">
      <div style={{ display: 'flex', width: '100%', height: '10px' }}>
        <div style={{ flex: '0 0 50%', background: '#ffc800' }} />
        <div style={{ flex: '0 0 25%', background: '#223a7a' }} />
        <div style={{ flex: '0 0 25%', background: '#d80e25' }} />
      </div>

      <div className="py-10 md:py-20 px-6 flex flex-col items-center gap-8 md:gap-10">
        <div className="flex items-center justify-center">
          <Image
            src="/logo-ungrd.png"
            alt="UNGRD"
            width={220}
            height={110}
            className="h-[110px] w-auto"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-[#213362]">
          {[
            { label: '@GestionUNGRD', src: '/icons/facebook.png', href: 'https://www.facebook.com/GestionUNGRD' },
            { label: '@UNGRD', src: '/icons/twitter.png', href: 'https://x.com/UNGRD' },
            { label: 'UNGRD Gestión del Riesgo de Desastres', src: '/icons/youtube.png', href: 'https://www.youtube.com/@gestiondelriesgo-ungrd' },
            { label: 'Unidad Nacional para la Gestión del Riesgo de Desastres', src: '/icons/linkedin.png', href: 'https://co.linkedin.com/company/ungrd' },
            { label: '@ungrd_oficial', src: '/icons/instagram.png', href: 'https://www.instagram.com/ungrd_oficial' },
            { label: '@ungrdcol', src: '/icons/tik-tok.png', href: 'https://www.tiktok.com/@ungrdcol' },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-inherit no-underline"
            >
              <div className="w-10 h-10 rounded-full bg-[#FFCD00] flex items-center justify-center">
                <Image
                  src={item.src}
                  alt={item.label}
                  width={20}
                  height={20}
                  style={{ width: 20, height: 20, objectFit: 'contain' }}
                />
              </div>
              <span className="text-sm font-semibold">{item.label}</span>
            </a>
          ))}
        </div>

        <a
          href="https://www.gestiondelriesgo.gov.co"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-[#213362] hover:text-[#07519D] transition-colors"
        >
          www.gestiondelriesgo.gov.co
        </a>
      </div>
    </footer>
  )
}

