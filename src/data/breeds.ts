import type { SizeClass } from '@/lib/types';

export interface Breed {
  name: string;
  size: SizeClass;
  adultKg: number; // typical adult weight, midpoint
  coat: 'short' | 'double' | 'long' | 'curly' | 'wire';
}

// Typical adult weights are midpoints of common breed-standard ranges. Owners can override.
export const BREEDS: Breed[] = [
  { name: 'Mixed breed / not sure', size: 'medium', adultKg: 18, coat: 'short' },
  { name: 'Beagle', size: 'medium', adultKg: 10, coat: 'short' },
  { name: 'Bernese Mountain Dog', size: 'giant', adultKg: 45, coat: 'double' },
  { name: 'Bichon Frise', size: 'small', adultKg: 6, coat: 'curly' },
  { name: 'Border Collie', size: 'medium', adultKg: 18, coat: 'double' },
  { name: 'Boston Terrier', size: 'small', adultKg: 9, coat: 'short' },
  { name: 'Boxer', size: 'large', adultKg: 30, coat: 'short' },
  { name: 'Cavalier King Charles Spaniel', size: 'small', adultKg: 7, coat: 'long' },
  { name: 'Chihuahua', size: 'toy', adultKg: 2.5, coat: 'short' },
  { name: 'Cocker Spaniel', size: 'medium', adultKg: 13, coat: 'long' },
  { name: 'Corgi (Pembroke)', size: 'medium', adultKg: 12, coat: 'double' },
  { name: 'Dachshund', size: 'small', adultKg: 9, coat: 'short' },
  { name: 'Dalmatian', size: 'large', adultKg: 25, coat: 'short' },
  { name: 'Doberman', size: 'large', adultKg: 38, coat: 'short' },
  { name: 'French Bulldog', size: 'small', adultKg: 11, coat: 'short' },
  { name: 'German Shepherd', size: 'large', adultKg: 34, coat: 'double' },
  { name: 'Golden Retriever', size: 'large', adultKg: 30, coat: 'double' },
  { name: 'Goldendoodle', size: 'large', adultKg: 25, coat: 'curly' },
  { name: 'Great Dane', size: 'giant', adultKg: 60, coat: 'short' },
  { name: 'Havanese', size: 'small', adultKg: 5, coat: 'long' },
  { name: 'Husky (Siberian)', size: 'medium', adultKg: 22, coat: 'double' },
  { name: 'Jack Russell Terrier', size: 'small', adultKg: 6.5, coat: 'wire' },
  { name: 'Labrador Retriever', size: 'large', adultKg: 32, coat: 'short' },
  { name: 'Labradoodle', size: 'large', adultKg: 25, coat: 'curly' },
  { name: 'Maltese', size: 'toy', adultKg: 3, coat: 'long' },
  { name: 'Maltipoo', size: 'toy', adultKg: 4, coat: 'curly' },
  { name: 'Miniature Schnauzer', size: 'small', adultKg: 7, coat: 'wire' },
  { name: 'Pomeranian', size: 'toy', adultKg: 2.5, coat: 'double' },
  { name: 'Poodle (Toy)', size: 'toy', adultKg: 3, coat: 'curly' },
  { name: 'Poodle (Miniature)', size: 'small', adultKg: 6, coat: 'curly' },
  { name: 'Poodle (Standard)', size: 'large', adultKg: 25, coat: 'curly' },
  { name: 'Pug', size: 'small', adultKg: 8, coat: 'short' },
  { name: 'Rottweiler', size: 'giant', adultKg: 48, coat: 'short' },
  { name: 'Samoyed', size: 'medium', adultKg: 23, coat: 'double' },
  { name: 'Shetland Sheepdog', size: 'small', adultKg: 9, coat: 'double' },
  { name: 'Shiba Inu', size: 'medium', adultKg: 9.5, coat: 'double' },
  { name: 'Shih Tzu', size: 'small', adultKg: 6, coat: 'long' },
  { name: 'Staffordshire Bull Terrier', size: 'medium', adultKg: 15, coat: 'short' },
  { name: 'Yorkshire Terrier', size: 'toy', adultKg: 3, coat: 'long' },
];

export const SIZE_INFO: Record<SizeClass, { label: string; range: string; defaultKg: number }> = {
  toy: { label: 'Toy', range: 'under 5 kg', defaultKg: 3.5 },
  small: { label: 'Small', range: '5 to 10 kg', defaultKg: 8 },
  medium: { label: 'Medium', range: '10 to 25 kg', defaultKg: 18 },
  large: { label: 'Large', range: '25 to 45 kg', defaultKg: 32 },
  giant: { label: 'Giant', range: 'over 45 kg', defaultKg: 55 },
};

export function findBreed(name: string): Breed | undefined {
  return BREEDS.find((b) => b.name === name);
}
