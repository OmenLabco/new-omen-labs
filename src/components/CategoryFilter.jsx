const categories = ['All', 'Recovery', 'Aesthetics', 'Performance', 'Longevity'];

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
      {categories.map((cat) => {
        const active = (cat === 'All' && !selected) || selected === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat === 'All' ? null : cat)}
            className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              active
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
