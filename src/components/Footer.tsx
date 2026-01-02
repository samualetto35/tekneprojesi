import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Tekne Kirala</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Denizle Buluşmanın En Kolay Yolu!
            </p>
          </div>

          {/* Tekne Türleri */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Tekne Türleri</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/yachts?type=daily" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Katamaran Kiralama
                </Link>
              </li>
              <li>
                <Link href="/yachts?type=daily" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Gulet Kiralama
                </Link>
              </li>
              <li>
                <Link href="/yachts?type=daily" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Yelkenli Kiralama
                </Link>
              </li>
              <li>
                <Link href="/yachts?type=daily" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Motoryat Kiralama
                </Link>
              </li>
              <li>
                <Link href="/yachts?type=hourly" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Jet Ski Kiralama
                </Link>
              </li>
            </ul>
          </div>

          {/* Bilgi */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Bilgi</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-white text-sm transition-colors">
                  İletişim
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Sıkça Sorulan Sorular
                </Link>
              </li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Yasal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Şartlar ve Kurallar
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="text-slate-300 hover:text-white text-sm transition-colors">
                  İptal Politikası
                </Link>
              </li>
              <li>
                <Link href="/distance-sales" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm text-center md:text-left">
              © {currentYear} Tekne Kirala. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/" className="hover:text-white transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/yachts" className="hover:text-white transition-colors">
                Tekneler
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

