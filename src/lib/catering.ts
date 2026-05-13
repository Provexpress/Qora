type CateringQuoteItem = {
  id: string;
  description: string;
  quantity: number;
  serviceItem?: {
    name: string;
    category: string;
  } | null;
};

const foodKeywords = [
  "alimentación",
  "alimentacion",
  "catering",
  "menú",
  "menu",
  "bebida",
  "bebidas",
  "bar",
  "estación",
  "estacion",
  "comida",
  "plato",
  "platos"
];

export function isCateringQuoteItem(item: CateringQuoteItem) {
  const text = `${item.description} ${item.serviceItem?.name ?? ""} ${item.serviceItem?.category ?? ""}`.toLowerCase();
  return foodKeywords.some((keyword) => text.includes(keyword));
}

export function cateringCategory(item: CateringQuoteItem) {
  const text = `${item.description} ${item.serviceItem?.name ?? ""}`.toLowerCase();

  if (text.includes("bebida") || text.includes("bar") || text.includes("estación") || text.includes("estacion")) {
    return "Bebidas";
  }

  return "Alimentos";
}

export function chefDefaultNotes(item: CateringQuoteItem) {
  if (cateringCategory(item) === "Bebidas") {
    return "Coordinar mise en place, hielo, cristalería, estación de servicio y reposición durante el evento.";
  }

  return "Validar menú vendido, porcionamiento, tiempos de salida, menaje requerido y observaciones alimentarias del cliente.";
}

export function buildCateringRequirement(item: CateringQuoteItem, serviceTime?: string | null) {
  return {
    quoteItemId: item.id,
    title: item.description,
    category: cateringCategory(item),
    quantity: item.quantity,
    serviceTime: serviceTime || null,
    chefNotes: chefDefaultNotes(item),
    status: "Pendiente"
  };
}
