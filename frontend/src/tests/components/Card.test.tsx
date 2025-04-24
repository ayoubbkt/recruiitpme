import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../../components/ui/Card';

describe('Card component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <div data-testid="card-content">Card Content</div>
      </Card>
    );
    const cardContent = screen.getByTestId('card-content');
    expect(cardContent).toBeInTheDocument();
    expect(cardContent).toHaveTextContent('Card Content');
  });

  it('renders title when provided', () => {
    render(<Card title="Card Title">Content</Card>);
    const title = screen.getByText('Card Title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-lg font-medium text-gray-900');
  });

  it('renders subtitle when provided', () => {
    render(<Card title="Card Title" subtitle="Card Subtitle">Content</Card>);
    const subtitle = screen.getByText('Card Subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toHaveClass('text-sm text-gray-500');
  });

  it('renders actions when provided', () => {
    const ActionButton = () => <button data-testid="action-button">Action</button>;
    render(<Card title="Card Title" actions={<ActionButton />}>Content</Card>);
    const actionButton = screen.getByTestId('action-button');
    expect(actionButton).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(<Card footer={<div data-testid="footer">Footer Content</div>}>Content</Card>);
    const footer = screen.getByTestId('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent('Footer Content');
  });

  it('applies correct padding classes based on padding prop', () => {
    const { rerender } = render(<Card padding="none">Content</Card>);
    let cardContent = screen.getByText('Content').parentElement;
    expect(cardContent).not.toHaveClass('p-3', 'p-4', 'p-6');

    rerender(<Card padding="small">Content</Card>);
    cardContent = screen.getByText('Content').parentElement;
    expect(cardContent).toHaveClass('p-3');

    rerender(<Card padding="normal">Content</Card>);
    cardContent = screen.getByText('Content').parentElement;
    expect(cardContent).toHaveClass('p-4');

    rerender(<Card padding="large">Content</Card>);
    cardContent = screen.getByText('Content').parentElement;
    expect(cardContent).toHaveClass('p-6');
  });

  it('does not render border when noBorder prop is true', () => {
    render(<Card noBorder>Content</Card>);
    const card = screen.getByText('Content').closest('.bg-white');
    expect(card).not.toHaveClass('border');
  });

  it('adds hover effect when hoverable prop is true', () => {
    render(<Card hoverable>Content</Card>);
    const card = screen.getByText('Content').closest('.bg-white');
    expect(card).toHaveClass('hover:shadow-md');
  });
});