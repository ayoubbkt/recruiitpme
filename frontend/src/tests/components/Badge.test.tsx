import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../../components/ui/Badge';

describe('Badge component', () => {
  it('renders children correctly', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText('New');
    expect(badge).toBeInTheDocument();
  });

  it('applies default variant class when no variant is provided', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-gray-800');
  });

  it('applies correct classes for primary variant', () => {
    render(<Badge variant="primary">Primary Badge</Badge>);
    const badge = screen.getByText('Primary Badge');
    expect(badge).toHaveClass('bg-primary-100');
    expect(badge).toHaveClass('text-primary-800');
  });

  it('applies correct classes for success variant', () => {
    render(<Badge variant="success">Success Badge</Badge>);
    const badge = screen.getByText('Success Badge');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('applies correct classes for danger variant', () => {
    render(<Badge variant="danger">Danger Badge</Badge>);
    const badge = screen.getByText('Danger Badge');
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  it('applies correct size classes based on size prop', () => {
    const { rerender } = render(<Badge size="sm">Small Badge</Badge>);
    let badge = screen.getByText('Small Badge');
    expect(badge).toHaveClass('text-xs');

    rerender(<Badge size="md">Medium Badge</Badge>);
    badge = screen.getByText('Medium Badge');
    expect(badge).toHaveClass('text-xs');

    rerender(<Badge size="lg">Large Badge</Badge>);
    badge = screen.getByText('Large Badge');
    expect(badge).toHaveClass('text-sm');
  });

  it('applies rounded-full class when rounded prop is true', () => {
    render(<Badge rounded>Rounded Badge</Badge>);
    const badge = screen.getByText('Rounded Badge');
    expect(badge).toHaveClass('rounded-full');
  });

  it('renders with icon when provided', () => {
    const Icon = () => <span data-testid="test-icon">🔔</span>;
    render(<Badge icon={<Icon />}>Badge with Icon</Badge>);
    const icon = screen.getByTestId('test-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('🔔');
  });

  it('applies additional classes from className prop', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-class');
  });
});