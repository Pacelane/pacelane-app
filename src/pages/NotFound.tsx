import React from "react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTheme } from "@/services/theme-context";
import { useTranslation } from "@/services/i18n-context";
import { typography } from "@/design-system/tokens/typography";
import { textStyles } from "@/design-system/styles/typography/typography-styles";
import { spacing } from "@/design-system/tokens/spacing";
import { cornerRadius } from "@/design-system/tokens/corner-radius";
import { getShadow } from "@/design-system/tokens/shadows";
import Button from "@/design-system/components/Button";
import { House as Home, ArrowLeft } from "@phosphor-icons/react";

const NotFound = () => {
  const location = useLocation();
  const { colors } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Title style using Awesome Serif font
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['6xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle style
  const subtitleStyle = {
    ...textStyles.lg.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  // Description style
  const descriptionStyle = {
    ...textStyles.md.normal,
    color: colors.text.muted,
    margin: 0,
    marginTop: spacing.spacing[16],
  };

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.subtle,
    padding: spacing.spacing[24],
  };

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '480px',
    gap: spacing.spacing[32],
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: colors.bg.card.default,
    borderRadius: cornerRadius.borderRadius.xl,
    padding: spacing.spacing[48],
    boxShadow: getShadow('regular.modalMd', colors, { withBorder: true }),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.spacing[32],
  };


  const errorCodeStyles: React.CSSProperties = {
    ...textStyles['2xl'].medium,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.code,
    letterSpacing: typography.desktop.letterSpacing.wide,
  };

  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.spacing[16],
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  return (
    <div style={containerStyles}>
      <div style={contentStyles}>
        <div style={cardStyles}>
          {/* Error code */}
          <div style={errorCodeStyles}>404</div>

          {/* Title and description */}
          <div>
            <h1 style={titleStyle}>{t('notFound.title')}</h1>
            <p style={subtitleStyle}>
              {t('notFound.subtitle')}
            </p>
            <p style={descriptionStyle}>
              A página "{location.pathname}" não foi encontrada. Ela pode ter sido movida, excluída, ou você digitou a URL errada.
            </p>
          </div>

          {/* Action buttons */}
          <div style={buttonContainerStyles}>
            <Button
              label={t('notFound.homeButton')}
              style="primary"
              size="lg"
              leadIcon={<Home size={20} />}
              onClick={() => window.location.href = '/product-home'}
            />
            <Button
              label={t('common.back')}
              style="secondary"
              size="lg"
              leadIcon={<ArrowLeft size={20} />}
              onClick={() => window.history.back()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
