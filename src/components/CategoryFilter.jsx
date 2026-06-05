const categories = ['All', 'Recovery', 'Aesthetics', 'Performance', 'Longevity'];

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat === 'All' ? null : cat)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            (cat === 'All' && !selected) || selected === cat
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
              : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-white/20 hover:bg-card/80'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}