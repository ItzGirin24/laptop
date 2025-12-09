-- MariaDB Database Migration Script for Laptop Collection System
-- Run this script to create the necessary tables

CREATE DATABASE IF NOT EXISTS laptop_collection;
USE laptop_collection;

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    student_number INT NOT NULL,
    class_name ENUM('XA', 'XB', 'XIA', 'XIB', 'XIC', 'XIIA', 'XIIB', 'XIIC') NOT NULL,
    locker_number VARCHAR(50) NOT NULL,
    collection_status ENUM('collected', 'not_collected') DEFAULT 'not_collected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_number (student_number),
    UNIQUE KEY unique_locker_number (locker_number)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    class_name ENUM('XA', 'XB', 'XIA', 'XIB', 'XIC', 'XIIA', 'XIIB', 'XIIC') NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Confiscations table
CREATE TABLE IF NOT EXISTS confiscations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    class_name ENUM('XA', 'XB', 'XIA', 'XIB', 'XIC', 'XIIA', 'XIIB', 'XIIC') NOT NULL,
    locker_number VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration INT NOT NULL, -- in days
    status ENUM('active', 'returned', 'cancelled') DEFAULT 'active',
    returned_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collection History table
CREATE TABLE IF NOT EXISTS collection_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    status ENUM('collected', 'not_collected') NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_students_class ON students(class_name);
CREATE INDEX idx_students_status ON students(collection_status);
CREATE INDEX idx_permissions_student ON permissions(student_id);
CREATE INDEX idx_permissions_date ON permissions(date);
CREATE INDEX idx_confiscations_student ON confiscations(student_id);
CREATE INDEX idx_confiscations_status ON confiscations(status);
CREATE INDEX idx_collection_history_student ON collection_history(student_id);
CREATE INDEX idx_collection_history_date ON collection_history(date);

-- Insert sample data (optional - remove if not needed)
INSERT INTO students (name, student_number, class_name, locker_number, collection_status) VALUES
('John Doe', 1, 'XA', 'A001', 'not_collected'),
('Jane Smith', 2, 'XA', 'A002', 'collected'),
('Bob Johnson', 3, 'XB', 'B001', 'not_collected');
