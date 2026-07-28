import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIModal } from '../src/components/AIModal';

// Mock del contexto de usuario y supabase
vi.mock('../src/context/UserContext', () => ({
  useUser: () => ({ profile: { id_usuario: '123' } })
}));

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id_prompt: 1 } })
        }))
      }))
    }))
  }
}));

describe('QA - Componente AIModal (Generación de Contenido)', () => {
  it('Debe renderizarse correctamente cuando isOpen es true', () => {
    render(<AIModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Generador de Contenido IA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej. cigarro premium/i)).toBeInTheDocument();
  });

  it('No debe renderizarse si isOpen es false', () => {
    const { container } = render(<AIModal isOpen={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('Debe mostrar error si se intenta generar sin ingresar tema', async () => {
    render(<AIModal isOpen={true} onClose={() => {}} />);
    
    const generateBtn = screen.getByRole('button', { name: /Generar Contenido Publicitario/i });
    fireEvent.click(generateBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Por favor, ingresa un tema o producto.')).toBeInTheDocument();
    });
  });

  it('Debe manejar errores de la API correctamente (Mock Fetch)', async () => {
    render(<AIModal isOpen={true} onClose={() => {}} />);
    
    // Configurar input
    const input = screen.getByPlaceholderText(/Ej. cigarro premium/i);
    fireEvent.change(input, { target: { value: 'Zapatos de verano' } });
    
    // Mockear la respuesta de fetch para que falle
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('Internal Server Error')
    });
    
    const generateBtn = screen.getByRole('button', { name: /Generar Contenido Publicitario/i });
    fireEvent.click(generateBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/Gemini API error 500/i)).toBeInTheDocument();
    });
  });
});
