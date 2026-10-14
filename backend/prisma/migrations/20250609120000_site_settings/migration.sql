-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'SAHRAA',
    "siteDescription" TEXT NOT NULL DEFAULT 'The premier COD marketplace in the GCC region',
    "siteLogo" TEXT,
    "siteFavicon" TEXT,
    "domainName" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "whatsappNumber" TEXT,
    "facebookUrl" TEXT,
    "tiktokUrl" TEXT,
    "snapchatUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "twitterUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- Insert default settings row
INSERT INTO "SiteSettings" ("id", "siteName", "siteDescription", "supportEmail", "supportPhone", "whatsappNumber", "domainName")
VALUES (
    'default',
    'SAHRAA',
    'The premier COD marketplace in the GCC region. Shop electronics, fashion, home & more with Cash on Delivery across Saudi Arabia, UAE, Kuwait, Qatar, Bahrain & Oman.',
    'support@sahraa.com',
    '+966 11 000 0000',
    '+966500000000',
    NULL
);
