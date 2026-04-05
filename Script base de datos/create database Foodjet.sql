IF DB_ID('FoodjetBackend') IS NULL
BEGIN
	CREATE DATABASE FoodjetBackend;
END;
GO

USE FoodjetBackend;
GO

IF OBJECT_ID('dbo.order_items', 'U') IS NOT NULL
	DROP TABLE dbo.order_items;
GO

IF OBJECT_ID('dbo.orders', 'U') IS NOT NULL
	DROP TABLE dbo.orders;
GO

IF OBJECT_ID('dbo.users', 'U') IS NOT NULL
	DROP TABLE dbo.users;
GO

IF OBJECT_ID('dbo.products', 'U') IS NOT NULL
	DROP TABLE dbo.products;
GO

CREATE TABLE dbo.users (
	id INT IDENTITY(1,1) PRIMARY KEY,
	name NVARCHAR(120) NOT NULL,
	email NVARCHAR(150) NOT NULL UNIQUE,
	password NVARCHAR(255) NOT NULL,
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

INSERT INTO dbo.users (name, email, password)
VALUES
	(N'Juan Perez', N'juan@example.com', N'$2a$10$7qB2v.R.m09QhI1R805B7O9V90r9G/h/w4Vz5bTq3m/qjA22O/E9a'); -- password is '123456' hashed with bcrypt
GO

CREATE TABLE dbo.products (
	id INT IDENTITY(1,1) PRIMARY KEY,
	name NVARCHAR(120) NOT NULL,
	description NVARCHAR(300) NOT NULL,
	price DECIMAL(10,2) NOT NULL,
	image_url NVARCHAR(500) NOT NULL,
	category NVARCHAR(80) NOT NULL
);
GO

INSERT INTO dbo.products (name, description, price, image_url, category)
VALUES
	(N'Hamburguesa Clásica', N'Jugosa hamburguesa con queso, lechuga, tomate y salsa especial', 18.90, N'https://images.unsplash.com/photo-1651843465180-5965076f7368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', N'Hamburguesas'),
	(N'Pizza Napolitana', N'Pizza tradicional con salsa de tomate, mozzarella y albahaca fresca', 32.90, N'https://images.unsplash.com/photo-1678443238947-e58d71bf2e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', N'Pizzas'),
	(N'Ramen Picante', N'Deliciosos fideos japoneses en caldo picante con cerdo y huevo', 25.90, N'https://images.unsplash.com/photo-1652937916838-09b9c2ff8b45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', N'Asiatica'),
	(N'Sushi Mix', N'Variedad de sushi fresco con salmon, atun y vegetales', 45.90, N'https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', N'Asiatica'),
	(N'Alitas BBQ', N'Alitas de pollo crujientes con salsa BBQ casera', 22.90, N'https://images.unsplash.com/photo-1618416682145-2fe1aaa6bd40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', N'Pollo'),
	(N'Cheesecake de Fresa', N'Delicioso cheesecake con topping de fresas frescas', 15.90, N'https://images.unsplash.com/photo-1759426016293-1b8be5849a72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', N'Postres'),
	(N'Ensalada Cesar', N'Ensalada fresca con pollo, crutones y aderezo cesar', 18.90, N'https://images.unsplash.com/photo-1654458804670-2f4f26ab3154?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', N'Saludable'),
	(N'Tacos al Pastor', N'Tres tacos mexicanos con carne al pastor y pina', 19.90, N'https://www.elfinanciero.com.mx/resizer/v2/PI7RTVF57RBAVEASTTWNJTW4OU.jpg?smart=true&auth=6e8833568df9cf61a4935c3c8f1a6c7139315e31d037857dfe33c09c68b59eb9&width=1440&height=810', N'Mexicana');
GO

CREATE TABLE dbo.orders (
	id INT IDENTITY(1,1) PRIMARY KEY,
	order_number VARCHAR(50) NOT NULL UNIQUE,
	user_id INT NOT NULL,
	customer_name NVARCHAR(120) NOT NULL,
	customer_phone VARCHAR(30) NOT NULL,
	customer_address NVARCHAR(250) NOT NULL,
	customer_reference NVARCHAR(250) NULL,
	payment_method VARCHAR(20) NOT NULL,
	subtotal DECIMAL(10,2) NOT NULL,
	delivery_fee DECIMAL(10,2) NOT NULL,
	total DECIMAL(10,2) NOT NULL,
	status VARCHAR(20) NOT NULL,
	created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
	CONSTRAINT FK_orders_users
		FOREIGN KEY (user_id) REFERENCES dbo.users(id)
);
GO

CREATE TABLE dbo.order_items (
	id INT IDENTITY(1,1) PRIMARY KEY,
	order_id INT NOT NULL,
	product_id INT NOT NULL,
	product_name NVARCHAR(150) NOT NULL,
	unit_price DECIMAL(10,2) NOT NULL,
	quantity INT NOT NULL,
	line_total DECIMAL(10,2) NOT NULL,
	CONSTRAINT FK_order_items_orders
		FOREIGN KEY (order_id) REFERENCES dbo.orders(id)
		ON DELETE CASCADE
);
GO