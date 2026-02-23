import { render, screen } from '@testing-library/react'
import { Logo } from '@/components/logo'

describe('Logo', () => {
  it('renders the branding text', () => {
    render(<Logo />)
    const brandingText = screen.getByText(/Quest/i)
    expect(brandingText).toBeInTheDocument()
  })

  it('renders with custom text size', () => {
    const customSize = '2rem'
    render(<Logo textSize={customSize} />)
    const brandingText = screen.getByText(/Quest/i)
    expect(brandingText).toHaveStyle({ fontSize: customSize })
  })
})
