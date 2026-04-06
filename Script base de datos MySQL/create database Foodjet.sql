CREATE DATABASE IF NOT EXISTS FoodjetBackend;
USE FoodjetBackend;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
	id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(150) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email, password)
VALUES
	('Juan Perez', 'juan@example.com', '$2b$10$9fngW4z4zcmSvTuqnTq33O9VEsuwUDHQeWYU8NuqLcJNxFZOe5mRu'); -- password is '123456' hashed with bcrypt

CREATE TABLE products (
	id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(120) NOT NULL,
	description VARCHAR(300) NOT NULL,
	price DECIMAL(10,2) NOT NULL,
	image_url VARCHAR(500) NOT NULL,
	category VARCHAR(80) NOT NULL
);

INSERT INTO products (name, description, price, image_url, category)
VALUES
	('Hamburguesa Clásica', 'Jugosa hamburguesa con queso, lechuga, tomate y salsa especial', 18.90, 'https://images.unsplash.com/photo-1651843465180-5965076f7368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', 'Hamburguesas'),
	('Pizza Napolitana', 'Pizza tradicional con salsa de tomate, mozzarella y albahaca fresca', 32.90, 'https://images.unsplash.com/photo-1678443238947-e58d71bf2e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', 'Pizzas'),
	('Ramen Picante', 'Deliciosos fideos japoneses en caldo picante con cerdo y huevo', 25.90, 'https://images.unsplash.com/photo-1652937916838-09b9c2ff8b45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', 'Asiatica'),
	('Sushi Mix', 'Variedad de sushi fresco con salmon, atun y vegetales', 45.90, 'https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', 'Asiatica'),
	('Alitas BBQ', 'Alitas de pollo crujientes con salsa BBQ casera', 22.90, 'https://images.unsplash.com/photo-1618416682145-2fe1aaa6bd40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', 'Pollo'),
	('Cheesecake de Fresa', 'Delicioso cheesecake con topping de fresas frescas', 15.90, 'https://images.unsplash.com/photo-1759426016293-1b8be5849a72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', 'Postres'),
	('Ensalada Cesar', 'Ensalada fresca con pollo, crutones y aderezo cesar', 18.90, 'https://images.unsplash.com/photo-1654458804670-2f4f26ab3154?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', 'Saludable'),
	('Tacos al Pastor', 'Tres tacos mexicanos con carne al pastor y pina', 19.90, 'https://www.elfinanciero.com.mx/resizer/v2/PI7RTVF57RBAVEASTTWNJTW4OU.jpg?smart=true&auth=6e8833568df9cf61a4935c3c8f1a6c7139315e31d037857dfe33c09c68b59eb9&width=1440&height=810', 'Mexicana');

CREATE TABLE orders (
	id INT AUTO_INCREMENT PRIMARY KEY,
	order_number VARCHAR(50) NOT NULL UNIQUE,
	user_id INT NOT NULL,
	customer_name VARCHAR(120) NOT NULL,
	customer_phone VARCHAR(30) NOT NULL,
	customer_address VARCHAR(250) NOT NULL,
	customer_reference VARCHAR(250) NULL,
	payment_method VARCHAR(20) NOT NULL,
	subtotal DECIMAL(10,2) NOT NULL,
	delivery_fee DECIMAL(10,2) NOT NULL,
	total DECIMAL(10,2) NOT NULL,
	status VARCHAR(20) NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT FK_orders_users
		FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
	id INT AUTO_INCREMENT PRIMARY KEY,
	order_id INT NOT NULL,
	product_id INT NOT NULL,
	product_name VARCHAR(150) NOT NULL,
	unit_price DECIMAL(10,2) NOT NULL,
	quantity INT NOT NULL,
	line_total DECIMAL(10,2) NOT NULL,
	CONSTRAINT FK_order_items_orders
		FOREIGN KEY (order_id) REFERENCES orders(id)
		ON DELETE CASCADE
);
