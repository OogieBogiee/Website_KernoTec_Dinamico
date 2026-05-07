import type { Schema, Struct } from '@strapi/strapi';

export interface AcordeonAccordion extends Struct.ComponentSchema {
  collectionName: 'components_acordeon_accordions';
  info: {
    displayName: 'accordion';
  };
  attributes: {
    description_accordion: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    media_accordion: Schema.Attribute.Media<'files' | 'videos' | 'images'> &
      Schema.Attribute.Required;
    title_accordion: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
  };
}

export interface AcordeonSocialNetwork extends Struct.ComponentSchema {
  collectionName: 'components_acordeon_social_networks';
  info: {
    displayName: 'social network';
    icon: 'thumbUp';
  };
  attributes: {
    social_network_name: Schema.Attribute.String;
    social_network_url: Schema.Attribute.String;
  };
}

export interface LayoutsSkill extends Struct.ComponentSchema {
  collectionName: 'components_layouts_skills';
  info: {
    displayName: 'skill';
    icon: 'apps';
  };
  attributes: {
    skill_background: Schema.Attribute.Media<'images', true> &
      Schema.Attribute.Required;
    skill_card_description: Schema.Attribute.Text & Schema.Attribute.Required;
    skill_description: Schema.Attribute.String & Schema.Attribute.Required;
    skill_icon: Schema.Attribute.Media<'images', true> &
      Schema.Attribute.Required;
    skill_title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    technology: Schema.Attribute.Component<'layouts.technology', true>;
  };
}

export interface LayoutsTechnology extends Struct.ComponentSchema {
  collectionName: 'components_layouts_technologies';
  info: {
    displayName: 'technology';
    icon: 'code';
  };
  attributes: {
    icon_technology: Schema.Attribute.Media<'images', true> &
      Schema.Attribute.Required;
    title_technology: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'acordeon.accordion': AcordeonAccordion;
      'acordeon.social-network': AcordeonSocialNetwork;
      'layouts.skill': LayoutsSkill;
      'layouts.technology': LayoutsTechnology;
    }
  }
}
