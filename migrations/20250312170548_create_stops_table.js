/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
    return knex.schema.createTable('stops', (table) => {
      table.integer('stop_id').primary();
      table.integer('stop_code').notNullable();
      table.string('stop_name').notNullable();
      table.decimal('stop_lat', 9, 6).notNullable();
      table.decimal('stop_lon', 9, 6).notNullable();
      table.string('zone_id').notNullable();
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export function down(knex) {
    return knex.schema.dropTable('stops');
  };