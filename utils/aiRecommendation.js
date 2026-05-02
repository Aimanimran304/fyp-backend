export const recommendTable = (tables, guests) => {

  const sorted = tables.sort((a,b)=>a.capacity-b.capacity)

  const table = sorted.find(t => t.capacity >= guests)

  return table
}