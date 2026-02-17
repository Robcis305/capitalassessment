import { render, screen } from '@testing-library/react'
import CapitalDecisionTool from '../CapitalDecisionTool'

describe('CapitalDecisionTool', () => {
  it('renders title and demo button', () => {
    render(<CapitalDecisionTool />)
    expect(screen.getByText(/Capital Decision Tool/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate AI Narrative/i })).toBeInTheDocument()
  })
})
