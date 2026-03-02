import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

type Crumb = { label: string; path: string };

export const Breadcrumb = ({ crumbs }: { crumbs: Crumb[] }) => {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.path}>
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
            {isLast ? (
              <span className="text-white font-medium">{crumb.label}</span>
            ) : (
              <button
                onClick={() => navigate(crumb.path)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {crumb.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
