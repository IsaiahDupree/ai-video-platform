"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  PlusCircle,
  Pencil,
  Trash2,
  Tag,
  Palette,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  listProducts,
  createProduct,
  deleteProduct as apiDeleteProduct,
  type Product,
} from "@/lib/api";

function ProductCard({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden group">
      {/* Color bar */}
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${product.brand.primaryColor}, ${product.brand.accentColor})`,
        }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">{product.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {product.brand.name}
            </p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/products/${product.id}`}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Link>
            <button
              onClick={() => onDelete(product.id)}
              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                <Tag className="h-2 w-2" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Brand colors */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full border border-border"
              style={{ background: product.brand.primaryColor }}
            />
            <span className="text-[10px] font-mono text-muted-foreground">
              {product.brand.primaryColor}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full border border-border"
              style={{ background: product.brand.accentColor }}
            />
            <span className="text-[10px] font-mono text-muted-foreground">
              {product.brand.accentColor}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-[10px] text-muted-foreground">
            {new Date(product.updatedAt).toLocaleDateString()}
          </span>
          <Link
            href={`/create?productId=${product.id}`}
            className="text-[10px] text-accent hover:underline"
          >
            Generate ads →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#635bff");
  const [accentColor, setAccentColor] = useState("#00d4ff");
  const [tags, setTags] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await listProducts();
      setProducts(data);
    } catch {
      // Server not available
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createProduct({
        name,
        description,
        brand: {
          name: brandName || name,
          primaryColor,
          accentColor,
        },
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setShowCreate(false);
      setName("");
      setDescription("");
      setBrandName("");
      setTags("");
      await loadProducts();
    } catch {
      // Handle error
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await apiDeleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Handle error
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage products for ad generation campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">New Product</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="NoteFlow AI"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="AI-powered writing assistant..."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder={name || "Brand"}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Primary
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 w-9 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-background px-2 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Accent
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-9 w-9 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-background px-2 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="saas, writing, ai"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Create Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-border bg-card">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-3">No products yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add your first product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
