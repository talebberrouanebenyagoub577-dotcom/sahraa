#!/bin/bash
# SAHRAA VPS Preparation Script
# For Hostinger VPS / Ubuntu 24.04
# Run as root: sudo bash scripts/setup-vps.sh

set -euo pipefail

echo "============================================"
echo "  SAHRAA VPS Setup — Ubuntu 24.04"
echo "============================================"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root: sudo bash $0"
  exit 1
fi

echo "[1/8] Updating system packages..."
apt-get update && apt-get upgrade -y

echo "[2/8] Installing essential packages..."
apt-get install -y \
  curl wget git unzip htop ufw fail2ban \
  apt-transport-https ca-certificates gnupg lsb-release

echo "[3/8] Configuring firewall (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "[4/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "[5/8] Configuring Docker..."
systemctl enable docker
systemctl start docker

# Add current user to docker group
if [ -n "${SUDO_USER:-}" ]; then
  usermod -aG docker "$SUDO_USER"
  echo "Added $SUDO_USER to docker group."
fi

echo "[6/8] Setting up fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

echo "[7/8] Configuring system limits..."
cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 65535
* hard nofile 65535
EOF

cat >> /etc/sysctl.conf << 'EOF'
# SAHRAA performance tuning
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
vm.overcommit_memory = 1
EOF
sysctl -p

echo "[8/8] Creating SAHRAA directory..."
mkdir -p /opt/sahraa
chown -R "${SUDO_USER:-root}:${SUDO_USER:-root}" /opt/sahraa

echo ""
echo "============================================"
echo "  VPS setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Clone SAHRAA to /opt/sahraa"
echo "  2. cp .env.example .env && edit secrets"
echo "  3. docker compose up -d"
echo "  4. ./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com"
echo "============================================"
