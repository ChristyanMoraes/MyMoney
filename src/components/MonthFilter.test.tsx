import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonthFilter } from "@/components/MonthFilter";

describe("MonthFilter", () => {
  it("chama onChange com o mês seguinte ao clicar em Próximo mês", () => {
    const onChange = vi.fn();
    render(<MonthFilter month={3} year={2026} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(onChange).toHaveBeenCalledWith(4, 2026);
  });
});
