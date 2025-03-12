/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
    return knex.schema.createTable('routes', (table) => {
      table.increments('id').primary();
      table.integer('route_id').notNullable();
      table.string('route_name').notNullable();
      table.integer('stop_id').notNullable();
      table.integer('stop_sequence').notNullable();
      table.float('dist_travelled').notNullable();
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export function down(knex) {
    return knex.schema.dropTable('routes');
  };