export const Header = () => {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl backdrop-blur sm:p-8 sm:text-left mb-8">
      <p className="text-xs uppercase tracking-[0.35em] text-white/50 sm:text-sm">
        câmeras sincronizadas
      </p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
        Reprodução perfeita em múltiplos ângulos
      </h1>
      <p className="mt-4 text-sm text-white/70 sm:max-w-xl sm:text-base">
        Circule ao redor do tatame e troque de câmera sem perder o instante.
        Cada mudança mantém o mesmo timestamp para analisar cada posição em
        qualquer perspectiva imediatamente.
      </p>
    </section>
  );
};
