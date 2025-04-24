import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../../components/ui/Input';

describe('Input component', () => {
  it('renders correctly with basic props', () => {
    render(<Input label="Test Input" placeholder="Enter something" />);
    const label = screen.getByText('Test Input');
    const input = screen.getByPlaceholderText('Enter something');
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(<Input label="Email" error="Invalid email format" />);
    const errorMessage = screen.getByText('Invalid email format');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('renders helper text when provided and no error', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);
    const helperText = screen.getByText('Must be at least 8 characters');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-gray-500');
  });

  it('renders with left icon when provided', () => {
    const LeftIcon = () => <div data-testid="left-icon" />;
    render(<Input label="Username" leftIcon={<LeftIcon />} />);
    const leftIcon = screen.getByTestId('left-icon');
    expect(leftIcon).toBeInTheDocument();
  });

  it('renders with right icon when provided', () => {
    const RightIcon = () => <div data-testid="right-icon" />;
    render(<Input label="Search" rightIcon={<RightIcon />} />);
    const rightIcon = screen.getByTestId('right-icon');
    expect(rightIcon).toBeInTheDocument();
  });

  it('calls onChange handler when input value changes', () => {
    const handleChange = vi.fn();
    render(<Input label="Text" onChange={handleChange} />);
    const input = screen.getByLabelText('Text');
    fireEvent.change(input, { target: { value: 'New Value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the input element', () => {
    const refCallback = vi.fn();
    render(<Input label="Ref Test" ref={refCallback} />);
    expect(refCallback).toHaveBeenCalledTimes(1);
    expect(refCallback.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
  });
});