import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { stroke } from '@/design-system/tokens/stroke';
import Button from '@/design-system/components/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  // Core props
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  
  // Pagination display options
  showLabels = true,           // Show "Previous" and "Next" labels
  showPageNumbers = true,      // Show page numbers
  maxPageNumbers = 5,          // Maximum page numbers to show
  
  // Styling
  size = 'md',                 // 'sm' | 'md' | 'lg'
  className,
  ...rest
}) => {
  const { colors } = useTheme();

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) return null;

  // Size configurations
  const sizeConfig = {
    sm: {
      buttonSize: 'xs',
      gap: spacing.spacing[4],
    },
    md: {
      buttonSize: 'sm',
      gap: spacing.spacing[8],
    },
    lg: {
      buttonSize: 'md',
      gap: spacing.spacing[12],
    },
  };

  const currentSizeConfig = sizeConfig[size];

  // Calculate which page numbers to show
  const getVisiblePages = () => {
    const pages = [];
    const halfMax = Math.floor(maxPageNumbers / 2);
    
    let startPage = Math.max(1, currentPage - halfMax);
    let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxPageNumbers - 1) {
      startPage = Math.max(1, endPage - maxPageNumbers + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  // Container styles
  const containerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: currentSizeConfig.gap,
    justifyContent: 'center',
  };

  // Page number button styles
  const getPageButtonStyle = (page) => {
    const isActive = page === currentPage;
    return isActive ? 'primary' : 'ghost';
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    if (page !== currentPage && onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div style={containerStyles} className={className} {...rest}>
      {/* Previous Button */}
      <Button
        style="ghost"
        size={currentSizeConfig.buttonSize}
        leadIcon={<ChevronLeft size={16} />}
        label={showLabels ? 'Previous' : undefined}
        variant={showLabels ? 'default' : 'iconOnly'}
        onClick={handlePrevious}
        disabled={currentPage === 1}
      />

      {/* Page Numbers */}
      {showPageNumbers && (
        <>
          {/* First page and ellipsis if needed */}
          {visiblePages[0] > 1 && (
            <>
              <Button
                style={getPageButtonStyle(1)}
                size={currentSizeConfig.buttonSize}
                variant="iconOnly"
                label="1"
                onClick={() => handlePageClick(1)}
              />
              {visiblePages[0] > 2 && (
                <span style={{
                  ...textStyles.sm.medium,
                  color: colors.text.muted,
                  padding: `0 ${spacing.spacing[4]}`,
                }}>
                  ...
                </span>
              )}
            </>
          )}

          {/* Visible page numbers */}
          {visiblePages.map(page => (
            <Button
              key={page}
              style={getPageButtonStyle(page)}
              size={currentSizeConfig.buttonSize}
              variant="iconOnly"
              label={page.toString()}
              onClick={() => handlePageClick(page)}
            />
          ))}

          {/* Last page and ellipsis if needed */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span style={{
                  ...textStyles.sm.medium,
                  color: colors.text.muted,
                  padding: `0 ${spacing.spacing[4]}`,
                }}>
                  ...
                </span>
              )}
              <Button
                style={getPageButtonStyle(totalPages)}
                size={currentSizeConfig.buttonSize}
                variant="iconOnly"
                label={totalPages.toString()}
                onClick={() => handlePageClick(totalPages)}
              />
            </>
          )}
        </>
      )}

      {/* Next Button */}
      <Button
        style="ghost"
        size={currentSizeConfig.buttonSize}
        tailIcon={<ChevronRight size={16} />}
        label={showLabels ? 'Next' : undefined}
        variant={showLabels ? 'default' : 'iconOnly'}
        onClick={handleNext}
        disabled={currentPage === totalPages}
      />
    </div>
  );
};

export default Pagination;
