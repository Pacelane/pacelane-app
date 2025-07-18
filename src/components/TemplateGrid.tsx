import React from 'react';
import { TemplateCard } from './TemplateCard';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface TemplateGridProps {
  templates: Template[];
  onTemplateSelect: (templateId: string) => void;
  onStartFromScratch: () => void;
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({ 
  templates, 
  onTemplateSelect, 
  onStartFromScratch 
}) => {
  return (
    <section className="w-full gap-3 mt-9 max-md:max-w-full">
      <div className="flex w-full gap-3 flex-wrap max-md:max-w-full">
        {templates.slice(0, 3).map((template) => (
          <TemplateCard
            key={template.id}
            title={template.title}
            description={template.description}
            icon={template.icon}
            onClick={() => onTemplateSelect(template.id)}
          />
        ))}
      </div>
      <div className="flex w-full gap-3 flex-wrap mt-3 max-md:max-w-full">
        {templates.slice(3, 6).map((template) => (
          <TemplateCard
            key={template.id}
            title={template.title}
            description={template.description}
            icon={template.icon}
            onClick={() => onTemplateSelect(template.id)}
          />
        ))}
      </div>
      <TemplateCard
        title="Start from scratch"
        description=""
        icon="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/978f4b5253f42a221c22bfec7c1f01be13b9cf83?placeholderIfAbsent=true"
        onClick={onStartFromScratch}
        isStartFromScratch={true}
      />
    </section>
  );
};
