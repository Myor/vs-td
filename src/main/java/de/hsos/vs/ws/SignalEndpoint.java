package de.hsos.vs.ws;

import de.hsos.vs.td.Lobby;
import static de.hsos.vs.td.LobbyList.lobbys;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.websocket.CloseReason;
import javax.websocket.CloseReason.CloseCodes;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint("/join/{lobby}")
public class SignalEndpoint {

    static final Logger logger = Logger.getLogger(SignalEndpoint.class.getName());

    @OnOpen
    public void onOpen(Session session, @PathParam("lobby") String id) throws IOException {
        logger.log(Level.INFO, "onOpen lobby {0}", id);

        synchronized (lobbys) {
            Lobby lobby = lobbys.get(id);
            if (lobby == null) {
                // Lobby erstellen
                lobbys.put(id, new Lobby(session));
            } else if (lobby.canJoin()) {
                // Lobby beitreten
                lobby.join(session);
                lobby.signal(session, lobby.buildJoinRequest().toString());
            } else {
                // Lobby voll
                session.close(new CloseReason(CloseCodes.VIOLATED_POLICY, null));
            }
        }
    }

    @OnMessage
    public void onMessage(String text, Session session, @PathParam("lobby") String id) {
        logger.log(Level.INFO, "onMessage lobby {0}", id);
        // Message zum Peer senden
        lobbys.get(id).signal(session, text);

    }

    @OnClose
    public void onClose(Session session, @PathParam("lobby") String id) throws IOException {
        logger.log(Level.INFO, "onClose lobby {0}", id);

        synchronized (lobbys) {
            Lobby lobby = lobbys.get(id);
            if (lobby != null && lobby.quit(session)) {
                lobbys.remove(id);
            }
        }
    }

    @OnError
    public void onError(Throwable t) {
        logger.log(Level.SEVERE, "Error in WS Endpoint", t);
    }

}
