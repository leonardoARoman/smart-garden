#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <errno.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <linux/ioctl.h>
#include <linux/types.h>
#include <linux/spi/spidev.h>
#include <termios.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <arpa/inet.h>
#include <unistd.h>

#define SPI_DEVICE "/dev/spidev0.0"  // SPI serial driver
#define TTY_DEVICE "/dev/pts/6"      // device to write information. This is a virtual serial device created by the socat utility (for reference: https://www.baeldung.com/linux/make-virtual-serial-port)
#define BAUD_RATE B9600              // Desired baud rate (9600 bps in this example)
#define SERVER_PORT 12345  // Port to send data to
#define SERVER_IP "127.0.0.1"  // IP address of the server

uint8_t SPI_MODE  = SPI_MODE_0;      // MCP3008 uses SPI mode 0
uint8_t SPI_BITS = 8;                // 8 bits per word
uint8_t MCP3008_CHANNELS = 8;        // MCP3008 has 8 channels
uint32_t SPI_SPEED = 500000;         // SPI speed in Hz (500 kHz is a safe value)

int spi_fd;
int tty_fd;
int sock_fd;

void spi_init();
void spi_end();
uint16_t mcp3008_read(uint8_t);
int configure_tty(int, speed_t);

int main(void)
{
    spi_init();
    // Sending data to Nodered using sockets and UDP protocol
    struct sockaddr_in server_addr;
    sock_fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock_fd < 0)
    {
        perror("socket");
        exit(EXIT_FAILURE);
    }

    // Prepare the server address structure
    memset(&server_addr, 0, sizeof(server_addr));  // Clear the structure
    server_addr.sin_family = AF_INET;  // Address family
    server_addr.sin_port = htons(SERVER_PORT);  // Port number (converted to network byte order)
    server_addr.sin_addr.s_addr = inet_addr(SERVER_IP);  // IP address

    // Sending data to Nodered using a virtual serial port
    /*tty_fd = open(TTY_DEVICE, O_WRONLY | O_NOCTTY);
    if (tty_fd < 0) {
        perror("Failed to open TTY device");
        return 1;
    }
    // Configure the TTY device with the desired baud rate
    if (configure_tty(tty_fd, BAUD_RATE) != 0) {
        close(tty_fd);
        return 1;
    }*/
    char message[1024];
    int channels = 2;
    while (1)
    {
        // Read annalog signal coming into channels 0 to n every 60 seconds
        for (int i = 0; i < channels; i++) {
            uint16_t value = mcp3008_read(i);
            sprintf(message, "{sensor: %d, data: %d}\n", i+1, value);
            printf ("size=%d message=%s", strlen(message), message);

            // Write message to TTY virtual serial device
            /*if (write(tty_fd, message, strlen(message)) < 0) {
                perror("Failed to write to TTY device");
                close(tty_fd);
                return 1;
            }*/
            // Send data to the udp server
            int sent_bytes = sendto(sock_fd, message, strlen(message), 0, (struct sockaddr *)&server_addr, sizeof(server_addr));
            if (sent_bytes < 0) {
                perror("sendto");
                close(sock_fd);
                exit(EXIT_FAILURE);
            }
        }
        sleep(1);
    }

    spi_end();
    return 0;
}

void spi_init()
{
    // Open the /dev/spidev serial driver in read/write mode.
    spi_fd = open(SPI_DEVICE, O_RDWR);
    if (spi_fd < 0) {
        perror("Failed to open SPI device");
        exit(EXIT_FAILURE);
    }

    // Set SPI mode
    if (ioctl(spi_fd, SPI_IOC_WR_MODE, &SPI_MODE) < 0) {
        perror("Failed to set SPI mode");
        close(spi_fd);
        exit(EXIT_FAILURE);
    }

    // Set SPI bits per word
    if (ioctl(spi_fd, SPI_IOC_WR_BITS_PER_WORD, &SPI_BITS) < 0) {
        perror("Failed to set SPI bits per word");
        close(spi_fd);
        exit(EXIT_FAILURE);
    }

    // Set SPI max speed
    if (ioctl(spi_fd, SPI_IOC_WR_MAX_SPEED_HZ, &SPI_SPEED) < 0) {
        perror("Failed to set SPI speed");
        close(spi_fd);
        exit(EXIT_FAILURE);
    }
}

void spi_end()
{
    close(spi_fd);
}

// Function to read data from MCP3008 IC
uint16_t mcp3008_read(uint8_t channel)
{
    uint8_t tx_buf[3];
    uint8_t rx_buf[3];
    struct spi_ioc_transfer transfer;

    if (channel > 7) {
        fprintf(stderr, "Invalid channel number %d\n", channel);
        exit(EXIT_FAILURE);
    }

    // Prepare the command to enable channel for MCP3008 using chip select
    tx_buf[0] = 0x01; // Start bit + single-ended bit
    tx_buf[1] = (0x08 /*0b1000*/ | (channel & 0x07 /*0b0111*/)) << 4; // Channel=0 (1000|(0&0111))<<4==(1000)<<4==0000 -> this enables channel 0
    tx_buf[2] = 0x00; // Don't care bits

    memset(&transfer, 0, sizeof(transfer));
    transfer.tx_buf = (unsigned long)tx_buf;
    transfer.rx_buf = (unsigned long)rx_buf;
    transfer.len = sizeof(tx_buf);
    transfer.speed_hz = SPI_SPEED;
    transfer.bits_per_word = SPI_BITS;
    transfer.delay_usecs = 0;

    // Read message from MCP3008
    if (ioctl(spi_fd, SPI_IOC_MESSAGE(1), &transfer) < 0) {
        perror("Failed to send SPI message");
        exit(EXIT_FAILURE);
    }

    // Combine the result bytes
    uint16_t result = ((rx_buf[1] & 0x03) << 8) | rx_buf[2];
    return result;
}

// Function to configure the TTY device
int configure_tty(int fd, speed_t baud_rate)
{
    struct termios tty;

    // Get current terminal settings
    if (tcgetattr(fd, &tty) != 0) {
        perror("Failed to get terminal attributes");
        return -1;
    }

    // Set the baud rate
    cfsetospeed(&tty, baud_rate);
    cfsetispeed(&tty, baud_rate);

    // Set 8-bit characters, no parity, one stop bit
    tty.c_cflag &= ~PARENB; // No parity
    tty.c_cflag &= ~CSTOPB; // 1 stop bit
    tty.c_cflag &= ~CSIZE;  // Mask character size bits
    tty.c_cflag |= CS8;     // 8-bit characters

    // Raw input and output
    tty.c_iflag &= ~(IXON | IXOFF | IXANY); // Disable software flow control
    tty.c_oflag &= ~OPOST;                  // Raw output

    // Apply the new settings
    if (tcsetattr(fd, TCSANOW, &tty) != 0) {
        perror("Failed to set terminal attributes");
        return -1;
    }

    return 0;
}
