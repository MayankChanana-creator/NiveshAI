



export const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="container mx-auto px-6 py-12">

        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold tracking-tight">
              Dhuran<span className="text-indigo-400">dhars</span>
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Building developer-first tools for financial workflows.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white/80">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a className="text-white/60 hover:text-white transition" href="#">Features</a></li>
              <li><a className="text-white/60 hover:text-white transition" href="#">Changelog</a></li>
              <li><a className="text-white/60 hover:text-white transition" href="#">Roadmap</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white/80">
              Resources
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a className="text-white/60 hover:text-white transition" href="#">Developers</a></li>
              <li><a className="text-white/60 hover:text-white transition" href="#">Blog</a></li>
              <li><a className="text-white/60 hover:text-white transition" href="#">Docs</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white/80">
              Connect
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a className="text-white/60 hover:text-white transition" href="#">Instagram</a></li>
              <li><a className="text-white/60 hover:text-white transition" href="#">YouTube</a></li>
              <li><a className="text-white/60 hover:text-white transition" href="#">GitHub</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <span>© {new Date().getFullYear()} Dhurandhars</span>
          <span>Built with Next.js & FastAPI</span>
        </div>
      </div>
    </footer>
  );
};
