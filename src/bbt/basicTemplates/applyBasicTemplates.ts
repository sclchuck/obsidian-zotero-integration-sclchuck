import { template } from '../template.helpers';
import { moment } from 'obsidian';

const creatorTemplate = `
{%- for creator in creators -%}
	{%- if creator.name -%}
		{{creator.name}}
	{%- else -%}
		{{creator.firstName}} {{creator.lastName}}
	{%- endif -%}
	{% if not loop.last %}, {% endif %}
{%- endfor -%}
`;

const pdfLinkTemplate = `
{%- set file = attachments | filterby("path", "endswith", ".pdf") | first -%}
{%- if file and file.path and file.path.endsWith(".pdf") -%}
	[{{file.title}}](file://{{file.path | replace(" ", "%20")}})
{%- endif -%}
`;

const pdfZoteroLinkTemplate = `
{%- set file = attachments | filterby("path", "endswith", ".pdf") | first -%}
{%- if file and file.path and file.path.endsWith(".pdf") -%}
	[{{file.title}}]({{file.desktopURI}})
{%- endif -%}
`;

const annotationsTemplate = `
{%- set annots = annotations | filterby("date", "dateafter", lastExportDate) -%}
{%- if annots.length > 0 %}
**Exported: {{exportDate | format("YYYY-MM-DD")}}**

{% for annotation in annots -%}
	{%- if annotation.annotatedText -%}
    > “{{annotation.annotatedText}}”{% if annotation.color %} {{annotation.colorCategory}} {{annotation.type | capitalize}} {% else %} {{annotation.type | capitalize}} {% endif %}[Page {{annotation.page}}](zotero://open-pdf/library/items/{{annotation.attachment.itemKey}}?page={{annotation.page}})
    {%- endif %}
	{%- if annotation.imageRelativePath -%}
	> ![[{{annotation.imageRelativePath}}]]
    {%- endif %}
{% if annotation.comment %}
{{annotation.comment}}
{% endif %}
{% endfor -%}
{%- endif -%}
`

export function applyBasicTemplates(itemData: Record<any, any>) {
  if (!itemData) return itemData;

  const creatorsByType = (itemData.creators || []).reduce(
    (byType: any, current: any) => {
      if (!byType[current.creatorType]) byType[current.creatorType] = [];
      byType[current.creatorType].push(current);
      return byType;
    },
    {}
  );

  Object.keys(creatorsByType).forEach((type) => {
    itemData[`${type}s`] = template.renderString(creatorTemplate, {
      creators: creatorsByType[type],
    }).trim();
  });

  const pdfLink = template.renderString(pdfLinkTemplate, itemData).trim();
  if (pdfLink) itemData.pdfLink = pdfLink;

  const pdfZoteroLink = template.renderString(pdfZoteroLinkTemplate, itemData).trim();
  if (pdfZoteroLink) itemData.pdfZoteroLink = pdfZoteroLink;

  if (itemData.notes?.length) {
    const notes = itemData.notes.reduce((combined: string, current: any) => {
      if (current.note) {
        return `${combined}\n\n${current.note.trim()}`;
      }

      return combined;
    }, '').trim();

    if (notes) {
      itemData.markdownNotes = notes;
    }
  }

  if (itemData.tags?.length) {
    itemData.allTags = itemData.tags.map((t: any) => t.tag).join(', ');
    itemData.hashTags = itemData.tags.map((t: any) => `#${t.tag.replace(/\s+/g, '-')}`).join(', ');
  }

  if (itemData.annotations?.length) {
      itemData.formattedAnnotationsNew = template.renderString(annotationsTemplate, itemData).trim()
      itemData.formattedAnnotations = template.renderString(annotationsTemplate, {
        ...itemData,
        lastExportDate: moment(0)
      }).trim()
  }

  return itemData;
}
