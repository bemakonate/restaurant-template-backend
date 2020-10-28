const types = () => `
type restaurantSettingsProduct {
    id: ID!
    created_at: DateTime!
    updated_at: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
    name: String
    price: Float
    sideProductsPerQuantity: Int
    description: String
    sideProducts(sort: String, limit: Int, start: Int, where: JSON): [restaurantSettingsSideProduct]
    categories(sort: String, limit: Int, start: Int, where: JSON): [restaurantSettingsCategory]
}

type restaurantSettingsSideProduct {
    id: ID!
    created_at: DateTime!
    updated_at: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
    name: String
    additionalCost: Float
    description: String
    products(sort: String, limit: Int, start: Int, where: JSON): [restaurantSettingsProduct]
}

type restaurantSettingsCategory {
    id: ID!
    created_at: DateTime!
    updated_at: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
    name: String
    description: String
    createCategoryPage: Boolean
    products(sort: String, limit: Int, start: Int, where: JSON): [restaurantSettingsProduct]
    hours:weeklyHours
}
`;

const customTypes = () => `
type weeklyHours{
    open:JSON
    closed:JSON
    source: String
}
`;

module.exports = {
    types,
    customTypes,
}