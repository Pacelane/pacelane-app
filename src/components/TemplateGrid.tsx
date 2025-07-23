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
    <section className="w-full mt-6">
      <div className="flex justify-center gap-3 max-w-2xl mx-auto">
        {templates.slice(0, 2).map((template) => (
          <TemplateCard
            key={template.id}
            title={template.title}
            description={template.description}
            icon={template.icon}
            onClick={() => onTemplateSelect(template.id)}
          />
        ))}
        <TemplateCard
          title="Start from scratch"
          description=""
          icon="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/978f4b5253f42a221c22bfec7c1f01be13b9cf83?placeholderIfAbsent=true"
          onClick={onStartFromScratch}
          isStartFromScratch={true}
        />
      </div>
    </section>
  );
};
