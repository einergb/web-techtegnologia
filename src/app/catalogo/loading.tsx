export default function CatalogLoading() {
  return <main aria-label="Cargando catálogo" className="mx-auto min-h-[70vh] w-full max-w-7xl flex-grow px-margin-mobile py-6 md:px-margin">
    <div className="mb-6 space-y-3 border-b border-outline-variant pb-5"><div className="skeleton h-4 w-64 rounded"/><div className="skeleton h-10 w-80 rounded"/><div className="skeleton h-5 w-full max-w-xl rounded"/></div>
    <div className="skeleton mb-6 h-16 rounded-lg"/>
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12"><aside className="hidden space-y-6 lg:col-span-3 lg:block"><div className="skeleton h-64 rounded-lg"/><div className="skeleton h-24 rounded-lg"/></aside><section aria-label="Productos cargando" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-9 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <article key={index} className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"><div className="skeleton h-52"/><div className="space-y-3 p-4"><div className="skeleton h-4 w-24 rounded"/><div className="skeleton h-7 rounded"/><div className="skeleton h-4 w-2/3 rounded"/><div className="skeleton mt-5 h-10 rounded-lg"/></div></article>)}</section></div>
  </main>;
}
