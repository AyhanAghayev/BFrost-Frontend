import type { TrendingTopic } from "@/lib/mock/trending";

export default function TrendingTopicsCard({ topics }: { topics: TrendingTopic[] }) {
  return (
    <section className="bg-white rounded-xl border border-border-subtle p-stack-md shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-label-md uppercase tracking-wider text-primary">Trending Topics</h3>
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
          trending_up
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {topics.map((topic, i) => (
          <div key={topic.id}>
            {i > 0 && <div className="h-px bg-border-subtle mb-4" />}
            <a className="group block" href="#">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
                {topic.category}
              </span>
              <span className="font-label-md text-primary group-hover:text-action-blue transition-colors">
                {topic.tag}
              </span>
              <span className="text-label-sm text-on-surface-variant block mt-1">
                {topic.summary}
              </span>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}