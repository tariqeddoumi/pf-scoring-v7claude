import { BindingResolver, type BindingRow } from "../binding-resolver";

describe("BindingResolver", () => {
  const mockBinding: BindingRow = {
    id: "b1",
    nodeId: "n1",
    sourceEntity: "CLIENT",
    sourceField: "nom",
    sourcePath: "nom",
    bindingMode: "AUTO_EDITABLE",
    dataType: "STRING",
    transformType: "NONE",
    transformConfigJson: null,
    defaultValue: null,
    fallbackValue: null,
    fallbackMessage: null,
    isActive: true,
    priority: 100,
  };

  const mockPayloads = {
    CLIENT: { nom: "ACME Corp", email: "info@acme.com" },
    PROJECT: { nom: "Solar Farm A", montant: 1000000 },
    EVALUATION: null,
    DOCUMENT: null,
    CALCULATED: null,
    EXTERNAL_REFERENCE: null,
    MANUAL: null,
  } as any;

  test("resolveOne reads from source via sourcePath", () => {
    const result = BindingResolver.resolveOne(mockBinding, mockPayloads);

    expect(result.bindingId).toBe("b1");
    expect(result.sourceEntity).toBe("CLIENT");
    expect(result.resolvedValue).toBe("ACME Corp");
    expect(result.isAvailable).toBe(true);
  });

  test("resolveOne uses fallbackValue when not available", () => {
    const binding = { ...mockBinding, sourcePath: "missing.field", fallbackValue: "Default Name" };
    const result = BindingResolver.resolveOne(binding, mockPayloads);

    expect(result.isAvailable).toBe(false);
    expect(result.resolvedValue).toBe("Default Name");
  });

  test("resolveOne applies NORMALIZE transform", () => {
    const binding = {
      ...mockBinding,
      transformType: "NORMALIZE",
    };
    const result = BindingResolver.resolveOne(binding, mockPayloads);

    expect(result.resolvedValue).toBe("acme corp");
  });

  test("resolveOne applies FORMAT transform for decimals", () => {
    const binding = {
      ...mockBinding,
      sourcePath: "montant",
      transformType: "FORMAT",
      transformConfigJson: JSON.stringify({ decimals: 2 }),
    };
    const result = BindingResolver.resolveOne(binding, {
      ...mockPayloads,
      PROJECT: { montant: 1234567.89 },
    });

    expect(result.resolvedValue).toBe(1234567.89);
  });

  test("resolveOne applies MAP_VALUE transform", () => {
    const binding = {
      ...mockBinding,
      transformType: "MAP_VALUE",
      transformConfigJson: JSON.stringify({
        map: { "ACME Corp": "Large Enterprise", "Small Co": "SME" },
      }),
    };
    const result = BindingResolver.resolveOne(binding, mockPayloads);

    expect(result.resolvedValue).toBe("Large Enterprise");
  });
});
